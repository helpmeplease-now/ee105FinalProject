# ee105FinalProject
gesture recognizing NN with frontend and 2048 implementation

link to report: https://docs.google.com/document/d/132QDDdh1lleCnyZeFD5ECC0cU3DrdKtAcfgNESdYYw0/edit?usp=sharing

steps to run:
1. copy contents of "modifiedAPDSLibrary" to ..\Documents\Arduino\libraries\Arduino_APDS9960 (if prompted, choose "replace")
2. connect arduino via USB
3. upload "arduino.ino" to ardunio
4. open terminal
5. cd to ..\src\backend
6. run "py server.py"
7. open new terminal
8. cd to ..\src\frontend
9. run "py -m http.server 8000"
10. open chrome browser
11. go to "http://127.0.0.1:8000/"
