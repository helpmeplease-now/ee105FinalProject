import serial

import serial.tools.list_ports

def list_all_ports():
    ports = serial.tools.list_ports.comports()

    if not ports:
        print("No serial ports found.")
    else:
        print("Available serial ports:")
        for port in ports:
            print(f"Port: {port.device}, Description: {port.description}")

list_all_ports()

serial_port = 'COM6';
baud_rate = 9600; #In arduino, Serial.begin(baud_rate)

ser = serial.Serial(serial_port, baud_rate)
command = ""

path = "C:/Users/Brad/Downloads/datacollectionforgestureNN/python stuff" 

w = 0; # manually update this before rerunning 
a = 0; # manually update this before rerunnning
s = 0; # manually update this before rerunnning
d = 0; # manually update this before rerunnning

while (command != "stop"):
    print("Type your command:")
    command = input("> ").strip()
    if (command == "w"):
        w = w + 1
        output_file = open(path + "/up/up_" + str(w) + ".csv", "w", encoding="utf-8");
    if (command == "a"):
        a = a + 1
        output_file = open(path + "/left/left_" + str(a) + ".csv", "w", encoding="utf-8");
    if (command == "s"):
        s = s + 1
        output_file = open(path + "/down/down_" + str(s) + ".csv", "w", encoding="utf-8");
    if (command == "d"):
        d = d + 1
        output_file = open(path + "/right/right_" + str(d) + ".csv", "w", encoding="utf-8");
    ser.write((command + '\n').encode())
    while command != "stop":
        line = ser.readline();
        line = line.decode("utf-8") #ser.readline returns a binary, convert to string
        if "Ready to enter next command" in line:
            break
        print(line);
        output_file.write(line.strip() + "\n");
print("change w into: " + str(w))
print("change a into: " + str(a))
print("change s into: " + str(s))
print("change d into: " + str(d))