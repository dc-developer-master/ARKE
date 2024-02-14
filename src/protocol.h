#pragma once
#include <stdint.h>

typedef struct basic_input {
    uint8_t packet_id;
    uint8_t input_cmd;
} basic_input;

typedef struct sidestick_input {
    uint8_t packet_id;
    uint16_t x_axis;
    uint16_t y_axis;
    uint16_t z_axis;
    uint8_t view;
    uint8_t throttle;
    uint16_t buttons;
} sidestick_input;