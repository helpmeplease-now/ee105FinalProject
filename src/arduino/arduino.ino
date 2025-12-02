/*
  ..\arduino\arduino.ino
  copy files in folder "modifiedAPDSLibrary" to ..\Documents\Arduino\libraries\Arduino_APDS9960
*/

bool readingEnabled = false; 
int counter = 0;

#include <iostream>
#include <Arduino_APDS9960.h>

void setup() {
  Serial.begin(9600);

  if (!APDS.begin()) {
    Serial.println("Error initializing APDS-9960 sensor.");
    while (true);
  }
}

int proximity = 0;
int r = 0, g = 0, b = 0;
unsigned long lastUpdate = 0;

void loop() {
  // continuously check for gestures
  if (APDS.gestureAvailable()) {
    int gesture = APDS.readGesture();
    switch (gesture) {
      case GESTURE_DOWN:
        Serial.println("Arduino Library Detected UP gesture");
        break;
      case GESTURE_UP:
        Serial.println("Arduino Library Detected DOWN gesture");
        break;
      case GESTURE_RIGHT:
        Serial.println("Arduino Library Detected LEFT gesture");
        break;
      case GESTURE_LEFT:
        Serial.println("Arduino Library Detected RIGHT gesture");
        break;
      default:
        break;
    }
  }

  APDS.writeData();  
  // delay(30);
}

