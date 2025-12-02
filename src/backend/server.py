# ..\backend\server.py
# neural network code adapted over from jupyter notebook file
# run "py -m pip install -r requirements.txt" in directory ..\src\backend

from flask import Flask, jsonify
from flask_cors import CORS
import serial
import serial.tools.list_ports
import numpy as np
import torch
import pickle
import threading
import time
import torch.nn as nn

class SimpleNetWithHiddenLayer(nn.Module):
    def __init__(self):
        super(SimpleNetWithHiddenLayer, self).__init__()
        self.hidden = nn.Linear(6 * 15, 5)
        self.relu = nn.ReLU()
        self.output = nn.Linear(5, 5)

    def forward(self, x):
        x = x.view(-1, 6 * 15)
        x = self.relu(self.hidden(x))
        x = self.output(x)
        return x

# load model
with open("modelHiddenLayer.pkl", "rb") as f:
    model = pickle.load(f)

model.eval()

current_gesture = "nothing"
current_proximity = 0.0

# arduino port auto detection
def detect_port():
    ports = serial.tools.list_ports.comports()
    for p in ports:
        try:
            ser = serial.Serial(p.device, 9600, timeout=1)
            time.sleep(0.2)
            ser.reset_input_buffer()

            for _ in range(5):
                line = ser.readline().decode("utf-8", errors="ignore").strip()
                parts = line.split(",")

                if len(parts) == 4 and all(x.strip().isdigit() for x in parts):
                    print(f"Arduino detected on {p.device}")
                    return p.device
            ser.close()
        except:
            pass
    print("No Arduino found.")
    return None

# process some output from arduino
def process_line(line):
    try:
        parts = line.split(",")
        parts = parts[:4]
        if len(parts) != 4:
            return None
        vals = [int(x) for x in parts]
        vals.append(vals[0] - vals[1])
        vals.append(vals[2] - vals[3])
        return vals
    except:
        return None

# serial + NN thread
def serial_thread():
    global current_gesture, current_proximity

    port = detect_port()
    if port is None:
        print("Running without Arduino.")
        return

    ser = serial.Serial(port, 9600, timeout=1)
    data_window = []

    while True:
        try:
            line = ser.readline().decode("utf-8", errors="ignore").strip()
            if not line:
                continue

            proc = process_line(line)
            if proc is None:
                continue

            if len(data_window) >= 15:
                data_window.pop(0)
            data_window.append(proc)

            if len(data_window) == 15:
                arr = np.array(data_window, dtype=np.float32)
                arr = arr / 255.0
                arr = (arr - 0.5) / 0.5
                tensor = torch.tensor(arr, dtype=torch.float32).unsqueeze(0).unsqueeze(0)

                with torch.no_grad():
                    output = model(tensor)
                    score, idx = torch.max(output, 1)
                    score = float(score.item())
                    idx = int(idx.item())

                labels = ["up", "left", "down", "right", "nothing"]
                if score > 6:
                    current_gesture = labels[idx]
                    current_proximity = score
                else:
                    current_gesture = "nothing"
                    current_proximity = score

                data_window = []

        except Exception as e:
            print("Serial error:", e)
            time.sleep(0.1)

# start thread
threading.Thread(target=serial_thread, daemon=True).start()

# flask API implementation
app = Flask(__name__)
CORS(app)

@app.route("/gesture")
def get_gesture():
    return jsonify({
        "gesture": current_gesture,
        "proximity": current_proximity
    })

@app.route("/health")
def health():
    return "ok"

if __name__ == "__main__":
    print("Backend up on http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000)