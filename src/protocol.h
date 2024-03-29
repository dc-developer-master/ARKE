#pragma once
#include <stdint.h>

#define INPUT_TYPE_BASIC 0x01
#define INPUT_TYPE_SIDESTICK 0x02

enum {
    CMD_BEND_FORWARD = (const uint8_t)'n',
    CMD_BEND_UP = (const uint8_t)'u',
    CMD_BEND_DOWN = (const uint8_t)'d',
    CMD_GO_FORWARD = (const uint8_t)'f',
    CMD_GO_BACKWARD = (const uint8_t)'b',
    CMD_STOP_GOING = (const uint8_t)'s',
    CMD_SQUIRM = (const uint8_t)'q'
};

typedef struct basic_input { // 2 byte
    uint8_t packet_id;
    uint8_t input_cmd;
} __attribute__((packed)) basic_input;

typedef struct sidestick_input { // 11 byte
    uint8_t packet_id;
    uint16_t x_axis;
    uint16_t y_axis;
    uint16_t z_axis;
    uint8_t view;
    uint8_t throttle;
    uint16_t buttons;
} __attribute__((packed)) sidestick_input;

typedef struct imu_output { // 12 byte
    uint16_t gyro_x;
    uint16_t gyro_y;
    uint16_t gyro_z;
    uint16_t accel_x;
    uint16_t accel_y;
    uint16_t accel_z;
} __attribute__((packed)) imu_output;