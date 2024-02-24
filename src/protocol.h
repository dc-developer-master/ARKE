#pragma once
#include <stdint.h>

#define INPUT_TYPE_BASIC 0x01
#define INPUT_TYPE_SIDESTICK 0x02

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