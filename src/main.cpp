#include <Arduino.h>
#include <WiFi.h>
#include "esp_camera.h"
#include "config.h"
#include "http_server.h"
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"
#include <driver/i2s.h>
#include <Deneyap_6EksenAtaletselOlcumBirimi.h>
#include <Deneyap_CiftKanalliMotorSurucu.h>
#include "deneyap.h"
#include <mdns.h>
#include <esp_websocket_client.h>
#include "protocol.h"

#define PART_BOUNDARY "123456789000000000000987654321"

const char* ssid = WIFI_SSID;
const char* password = WIFI_PASSWORD;
httpd_handle_t server = NULL;

const char* _STREAM_CONTENT_TYPE = "multipart/x-mixed-replace;boundary=" PART_BOUNDARY;
const char* _STREAM_BOUNDARY = "\r\n--" PART_BOUNDARY "\r\n";
const char* _STREAM_PART = "Content-Type: image/jpeg\r\nContent-Length: %u\r\n\r\n";

const char* IMU_JSON_RES = "{\"acceleration\": {\"x\": %f, \"y\": %f, \"z\": %f}, \"gyro\": {\"x\": %f, \"y\": %f, \"z\": %f}}";

esp_err_t camstream_url_handler(httpd_req_t* request);
esp_err_t imustream_uri_handler(httpd_req_t* request);
esp_err_t ws_connect_url_handler(httpd_req_t* request);
httpd_handle_t camstream_httpd_initialize();

void websocket_event_handler(void* handler_arg, esp_event_base_t event_base, int32_t handler_call_reason, void* event_data);


httpd_uri_t camstream_uri = {
    .uri = "/camstream",
    .method = HTTP_GET,
    .handler = camstream_url_handler,
    .user_ctx = NULL
};

httpd_uri_t imustream_uri = {
    .uri = "/imustream",
    .method = HTTP_GET,
    .handler = imustream_uri_handler,
    .user_ctx = NULL
};

httpd_uri_t ws_connect_uri = {
    .uri = "/connect_ws",
    .method = HTTP_GET,
    .handler = ws_connect_url_handler,
    .user_ctx = NULL
};

LSM6DSM imu;
DualMotorDriver motor_driver;

void setup() {

    WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);

    Serial.begin(9600);

    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, password);
    while(WiFi.status() != WL_CONNECTED) {
        Serial.print(".");
        delay(500);
    }

    Serial.println("\\\x6e\\Connected");
    Serial.println(WiFi.localIP());

    Serial.printf(
        "Xtal frequency = %d MHz\nCPU Operating Frequency = %d MHz\nAPB Bus Operating frequency = %d Hz\n",
        getXtalFrequencyMhz(),
        getCpuFrequencyMhz(),
        getApbFrequency()
    );
    
    if(mdns_init() != ESP_OK) {
        Serial.println("Unable to start mdns");
    }
    
    if(mdns_hostname_set("arke") != ESP_OK) {
        Serial.println("Unable to set hostname");
    }

    if(mdns_service_add(NULL, "_http", "_tcp", 80, NULL, 0) != ESP_OK) {
        Serial.println("Unable add service");
    }

    Wire.begin(D10, D11);

    SensorSettings imu_config;
    imu_config.gyroRange = 500;
    imu_config.accelRange = 16;

    (void) imu.begin(0x6a, &imu_config);
    (void) motor_driver.begin(0x16);

    camera_config_t config;
    config.ledc_channel = LEDC_CHANNEL_0;
    config.ledc_timer = LEDC_TIMER_0;
    config.pin_d0 = CAMD2;
    config.pin_d1 = CAMD3;
    config.pin_d2 = CAMD4;
    config.pin_d3 = CAMD5;
    config.pin_d4 = CAMD6;
    config.pin_d5 = CAMD7;
    config.pin_d6 = CAMD8;
    config.pin_d7 = CAMD9;
    config.pin_xclk = CAMXC;
    config.pin_pclk = CAMPC;
    config.pin_vsync = CAMV;
    config.pin_href = CAMH;
    config.pin_sscb_sda = CAMSD;
    config.pin_sscb_scl = CAMSC;
    config.pin_pwdn = -1;
    config.pin_reset = -1;
    config.xclk_freq_hz = 15000000;
    config.frame_size = FRAMESIZE_VGA;
    config.pixel_format = PIXFORMAT_JPEG;
    //config.pixel_format = PIXFORMAT_RGB565; // for face detection/recognition
    //config.grab_mode = CAMERA_GRAB_WHEN_EMPTY;
    config.jpeg_quality = 8;
    config.fb_count = 1;

    Serial.println("Camera initializing");

    if(esp_camera_init(&config) != ESP_OK) {
        Serial.println("Unable to initialize camera");
        ESP.restart();
    }

    delay(5000);

    camera_fb_t* framebuffer = esp_camera_fb_get();
    Serial.printf("%s\n", framebuffer->buf);
    esp_camera_fb_return(framebuffer);

    server = camstream_httpd_initialize();

    // while(1);

}

esp_err_t camstream_url_handler(httpd_req_t* request) {

    httpd_resp_set_type(request, _STREAM_CONTENT_TYPE);
    httpd_resp_set_hdr(request, (const char*)"Connection", (const char*)"keep-alive");

    char part_buf[64];
    int status = 0;

    camera_fb_t* framebuffer = esp_camera_fb_get();

    while(status == ESP_OK) {
        framebuffer = esp_camera_fb_get();

        int part_buf_len = snprintf(part_buf, 64, _STREAM_PART, framebuffer->len);
        httpd_resp_send_chunk(request, part_buf, (ssize_t)part_buf_len);

        httpd_resp_send_chunk(request, (const char*)framebuffer->buf, framebuffer->len);

        status = httpd_resp_send_chunk(request, _STREAM_BOUNDARY, strlen(_STREAM_BOUNDARY));

        esp_camera_fb_return(framebuffer);
    }


    return ESP_OK;
}

esp_err_t imustream_uri_handler(httpd_req_t* request) {

    float accel_x, accel_y, accel_z;
    float gyro_x, gyro_y, gyro_z;
    float temp;

    imu.readAllAxesFloatData(&accel_x);
    
    char imu_res_buf[256];

    int bytes_written = snprintf(imu_res_buf, 256, IMU_JSON_RES,
        accel_x, accel_y, accel_y,
        gyro_x, gyro_y, gyro_z
    );

    // deprecated
    // int bytes_written = snprintf(imu_res_buf, 256, IMU_JSON_RES,
    //     imu.readFloatAccelX(), imu.readFloatAccelY(), imu.readFloatAccelZ(),
    //     imu.readFloatGyroX(), imu.readFloatGyroY(), imu.readFloatGyroZ()
    // );

    (void) httpd_resp_send(request, imu_res_buf, (size_t) bytes_written);

    return ESP_OK;
}

esp_err_t ws_connect_url_handler(httpd_req_t* request) {

    esp_websocket_client_config_t ws_config = {};

    ws_config.subprotocol = "soap";

    char * url_field_name = "Ws-Url";
    char * port_field_name = "Ws-Port";
    char url_buffer[64];
    char port_buffer[8];
    int port_num = 0;

    httpd_req_get_hdr_value_str(request, url_field_name, url_buffer, 64);
    httpd_req_get_hdr_value_str(request, port_field_name, port_buffer, 8);

    sscanf(port_buffer, "%d", &port_num);

    ws_config.uri = url_buffer;
    ws_config.port = port_num;

    Serial.printf("%s:%d", url_buffer, port_num);

    esp_websocket_client_handle_t websocket_handle = esp_websocket_client_init(&ws_config);

    esp_websocket_register_events(websocket_handle, WEBSOCKET_EVENT_ANY, websocket_event_handler, (void *)websocket_handle);
    esp_websocket_client_init(&ws_config);
    esp_websocket_client_start(websocket_handle);

    if(esp_websocket_client_is_connected(websocket_handle)) Serial.println("new ws");

    httpd_resp_send_404(request);

    return ESP_OK;
}

void websocket_event_handler(void* handler_arg, esp_event_base_t event_base, int32_t handler_call_reason, void* event_data) {

    esp_websocket_event_data_t* data = (esp_websocket_event_data_t *) event_data;

    switch(handler_call_reason) {
        case WEBSOCKET_EVENT_CONNECTED:
            Serial.println("Websocket connected");
        break;
        case WEBSOCKET_EVENT_DISCONNECTED:
            
        break;
        case WEBSOCKET_EVENT_DATA:
            Serial.printf("Data from ws\r\n%s\n", data->data_ptr);
        break;
        case WEBSOCKET_EVENT_ERROR:
        break;
    }
}


httpd_handle_t camstream_httpd_initialize() {

    httpd_config_t httpd_config = HTTPD_DEFAULT_CONFIG();
    httpd_handle_t server = NULL;

    if(httpd_start(&server, &httpd_config) == ESP_OK) {
        httpd_register_uri_handler(server, &camstream_uri);
        httpd_register_uri_handler(server, &imustream_uri);
        httpd_register_uri_handler(server, &ws_connect_uri);
    }
    
    return server;
}

void loop() {
}