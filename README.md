Go-Back-N ARQ Implementation


Demo(Live):

http://careful-aleph-186923.appspot.com/


Environment

Platform: Windows 10, Mac, Google Chrome

Language: JavaScript, JQuery, HTML, CSS



**Steps to run the simulator**

-Clone the project

-The clone project will contain these files: index.html, app.js, app.css

-Open the index.html file in a google chrome browser since it was tested mostly in google browser. It may not work correctly in small window so please maximize the Window.

-The page will appear with default properties like Number of frames, Speed, etc. Please feel free to change their numeric values.

-The simulation area, "ready frames" for the senders will appear on the top od the simulation area and "expected frame" slots for recievers will appear in the bottom of the simulation area.

-Sliding window covers the frames those are ready to get transmitted from sender.


~Some of the quick simulation controls are specified below:

Perform a mouse click on required "ready info frame" (frame 0, frame1,....frameN) on sender side to issue damaged "Info Frames"
To damage or kill a moving frame or ACK, feel free to click on it. This will make frame to be lost/damaged.
Click on "Stop" button any time to completely stop the simulation and get page refreshed.
Click on green color "Start" button to start the simulation. This will start generating RR ACK if the below steps are not performed yet.

REJ ACK Simulation: In order to simulate damaged info frame, please click on the frame on the sender side before it gets transmitted. As soon as you click on the sender side frame, it will appear in black color and it will send damaged from to receiver.

ACK Poll/Final Command Simulation: The ACK Poll frame is issued by sender when RR ACK is not received in a specified time. In order to simulate this case, either click on the moving info frame or RR frame to kill. Then, please wait for specified timeout time to see ACK Poll get issued from sender and wait to see the ACK Final from receiver.


Assumption:

We do not display running timer on screen, however, the timer is running on the specified interval and keeps polling until RR ACK is received for a frame sequence. So, please wait until the timer expires to send the poll request.
We assumed that killing a ACK is similar as damaging it.
