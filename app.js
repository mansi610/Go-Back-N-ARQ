/**
 * This file defines three group of functions
 * 1. Application common controller, utility functions
 * 2. Sender functions
 * 3. Receiver functions
 **/


/*
 *
 *
 * //////////// 1. APPLICATION Common controller, utility functions goes here /////////
 *
 */

//Global properties
var sfSlots;// Sender frame slots or a queue	
var rfSlots; // Receiver frame Slots or a queue
var totalFrames; //Total frames
var windowPanel; // Sliding Window UI
var windowSize; // Sliding window size
var windowSb; // Window start sequence
var windowSm; // Sliding window sequence maximum currently
var timeout; // Sender time out value to generate ACK POLL command
var speed; // Speed of the transmission (Animation)
var rcvrExptedSn = 0; //Receiver expected sequence

var pollIntervals = []; // IDs of poll intervals
var timers = []; // IDs of timers

$(document).ready(function() {

    // Start simulation on start button click
    $("#startBtn").click(function(event) {
        //event.preventDefault();

        //Initialize the app
        init();

        log("Starting simulator, please wait..");
        //Allow delay to user to select the sender frame slots to send damaged frame
        setTimeout(function() {
            startSender();
        }, 1000);

    });

    // Refresh the entire page on stop request, this can be improved later without refreshing the complete page
    $("#stopBtn").click(function(event) {
        location.reload();
    });

});

//Initialize the application state
function init() {
    clearConsole();
    cleanup();
    clearTimeout();
    readProperties();
    createFrameSlots();
    createWindow();
    log("Initializing app...");
}

// Read user entered properties and populate them into global properties
function readProperties() {
    totalFrames = $("#totalFrames").val();
    windowSize = $("#windowSize").val();
    timeout = $("#timeout").val();
    speed = $("#speed").val();
    windowSb = 0;
    windowSm = windowSize - 1;
}


// Returns receiver location (address)
function receiverAddress() {
    var height = rfSlots[0].position().top;
    return height;
}

// Returns sender location (address)
function senderAddress() {
    var height = sfSlots[0].position().top;
    return height;
}

//Check whether the provided frame got damaged
function isDamagedFrame(frame) {
    // In real life, re-generate CRC and compare against the sender's CRC

    // Adding below code for simulation purpose only
    if (frame.attr("class").indexOf("damagedFrame") != -1) {
        return true;
    }

    return false;

}

// Transmit frame into medium
function transmitFrame(frame, topPos, leftPos) {
    //Put frame into medium
    frame.css({
        top: topPos,
        left: leftPos,
        position: "absolute"
    });
    $("#medium").append(frame);
}

//Propagate frame in medium
function propagateFrame(frame, position, completeCallback) {
    // Start transmission, call receiver when transmission completes
    frame.animate({
            top: position
        }, speed * 1000)
        .promise().done(completeCallback);

}


// Cleanup the ground
function cleanup() {
    $("#sender").empty();
    $("#medium").empty();
    $("#receiver").empty();
    sfSlots = []; // Sender frame slots
    rfSlots = []; // Receiver frame Slots
    windowPanel = null;
    rcvrExptedSn = 0; //Receiver expected sequence
    clearTimerIntervals(); // //Clear pollIntervals if anything running
}

//Create frame slots on sender and receier side to have them set up for communication
function createFrameSlots() {
    for (var i = 0; i < totalFrames; i++) {

        //Create sender side frame slots   
        var sfSlot = createFrameUi("readyFrame", "Frame " + i, i, i);
        sfSlot.attr("title", "Click to mark to demage.");

        sfSlot.on("click", function() {
            log("User: " + $(this).text() + "- Marked to demage.");
            $(this).addClass("damagedFrame");
        });

        sfSlots.push(sfSlot);
        $("#sender").append(sfSlot);


        //Create received side frame slots
        var rfSlot = createFrameUi("expectedFrame", "Frame " + i, i);
        rfSlots.push(rfSlot);
        $("#receiver").append(rfSlot);
    }
}


// Extract sequence number from frame
function sequenceNo(frame) {
    return frame.attr("id");
}

// Extract expected sequence number from frame
function expectedSqNo(frame) {
    return frame.attr("name");
}


//Creates the requested frame
function createFrame(frameStyle, text, sequenceNo, data) {
    var frame = createFrameUi(frameStyle, text, sequenceNo, data);
    frame.attr("title", "Click to kill");

    // Kill frame by a click
    frame.on("click", function() {
        $(this).remove();
        log("Killed - " + $(this).text());
    });

    return frame;

}

// Create frame like UI
function createFrameUi(frameStyle, text, sequenceNo, data) {
    var $frame = $("<span></span>");
    $frame.addClass("frame");
    $frame.addClass(frameStyle);
    $frame.text(text);
    $frame.attr("id", sequenceNo);
    $frame.attr("name", data);
    return $frame;
}

// Creates sliding window UI
function createWindow() {

    windowPanel = $("<div></div>"); //Sliding Window
    windowPanel.addClass("swindow");
    var sfSlot = sfSlots[windowSb];
    var width = sfSlot.outerWidth() * windowSize + windowSize * 10 + 2;
    windowPanel.css("width", width);
    windowPanel.css({
        top: sfSlot.position().top - 10,
        left: sfSlot.position().left,
        position: "absolute"
    });
    $("#medium").append(windowPanel);
}

//When transmission of all frames done, just clear the window from view
function clearWindow() {
    windowPanel.fadeOut(3000);
}


//Utility function to identify frame type
function frameType(frame) {
    var frameClass = frame.attr("class");
    if (frameClass.indexOf("readyFrame") != -1)
        return "readyFrame";
    else if (frameClass.indexOf("ackRRFrame") != -1)
        return "ackRRFrame";
    else if (frameClass.indexOf("ackREJFrame") != -1)
        return "ackREJFrame";
    else if (frameClass.indexOf("ackPollFrame") != -1)
        return "ackPollFrame";
    else if (frameClass.indexOf("transmittedFrame") != -1)
        return "transmittedFrame";
    else if (frameClass.indexOf("infoFrame") != -1)
        return "infoFrame";
    else if (frameClass.indexOf("ackFinalFrame") != -1)
        return "ackFinalFrame";
}

// Log message on console
function log(message) {
    $("#console").append($("<div></div>").text(message)).
    animate({
        scrollTop: $('#console')[0].scrollHeight
    }, 200);
}

//Clear the console whenever needed
function clearConsole() {
    $("#console").empty();
}


/***
 *
 *
 *   ////////////////////// 2. SENDER functions goes below //////////////////////
 *
 */

/**
Sender functions are defined on this file
**/

//Sender - Starting the transmission from sender end
function startSender() {
    log("Sender ready..");
    log("Receiver ready..");

    //Start transmitting the frames which all inside the window
    for (var i = 0; i < windowSize; i++) {
        var frame = createFrame("infoFrame", "Frame " + i, i);
        sendInfoFrame(i);
    }
}

// Sender - sending infoFrame
function sendInfoFrame(sn) {

    // If frame has already been transmitted state, don't send again
    if (frameType(sfSlots[sn]) == "transmittedFrame")
        return;

    //Create info frame
    var frame = createFrame("infoFrame", "Frame " + sn, sn);

    //Simulate damaged frame
    if (isDamagedFrame(sfSlots[sn])) {
        frame.addClass("damagedFrame");
        sfSlots[sn].removeClass("damagedFrame");
    }

    log("Sender: Transmitting - " + frame.text());

    //Transmit frame into medium
    transmitFrame(frame, sfSlots[sn].position().top + 10, sfSlots[sn].position().left);

    // Start propagation, call receiver when transmission completes      
    propagateFrame(frame, receiverAddress(), function() {
        receiver($(this));
    });

    // Create Timer for each transmitted frame
    var timer = setTimeout(handleInfoFrameTimeout, timeout, frame);
    timers.push(timer);
}

//Sender - process time out when ACK is not received from receiver for a frame
function handleInfoFrameTimeout(timedOutFrame) {

    var pollReceiver = function() {

        //Ignore timeout if ACK already received for frame
        var sn = sequenceNo(timedOutFrame);
        var frameSlotStatus = frameType(sfSlots[sn]);
        if (frameSlotStatus == "transmittedFrame") {
            var pollData = getPollIntervalData(sn);
            pollData.active = 0;
            clearInterval(pollReceiver);
            return; // Don't have to process timeout
        }

        if (isAnyPollIntervalActive(sn)) {
          // log("There is already active AckPoll request, skipping timer for SN -" + sn);
            return;
        }

        //Timeout logic - Create ACK POLL frame
        log("Sender: Timed out - " + sn);
        var frame = createFrame("ackPollFrame", "Ack Poll", sn);

        //Transmit ACK POLL frame into medium
        transmitFrame(frame, sfSlots[sn].position().top + 10, sfSlots[sn].position().left);

        // Start propagation, call receiver when transmission completes      
        propagateFrame(frame, receiverAddress(), function() {
            receiver($(this));
        });
    };

    //Sender polls receiver untill it receives RR Final=1
    var id = setInterval(pollReceiver, timeout);
    pollIntervals.push(new PollIntervalData(id, sequenceNo(timedOutFrame), 1));

}


function clearTimerIntervals() {

    //Clear timers
    for (var i = 0; i < timers.length; i++) {
        clearTimeout(timers[i]);
    }

    //Clear pollIntervals
    for (var j = 0; j < pollIntervals.length; j++) {
        var pollData = pollIntervals[j];
        pollData.active = 0;
        clearInterval(pollData.id);
    }

    timers = []; // Make empty
    pollIntervals = []; //Make empty

}

function clearPollTimerIntervalsBySn(sn) {

    //Clear pollIntervals
    for (var j = 0; j < pollIntervals.length; j++) {
       // var pollData = pollIntervals[j];
        //log("Clear - pollData = " + pollData.sn + " sn="+sn);
        if (pollIntervals[j].sn <=  Number(sn)) {
           // log("clearPollTimerIntervalsBySn - " + sn);
            pollIntervals[j].active = 0;
            clearInterval(pollIntervals[j].id);
           // window.alert("Stop");
        }
    }
}

// Check whether there is already active poll request in the window to prevernt over whelming of ACKPoll request
function isAnyPollIntervalActive(sn) {
    for (var i = 0; i < pollIntervals.length; i++) {
        var pollData = pollIntervals[i];
        
        if ((pollData.active == 1) && (Number(pollData.sn) < Number(sn)) ){
           log("Already sn="+sn + " pollData.sn="+pollData.sn);
            return true;
        }
    }
    return false;
}

// Poll interval data object
function PollIntervalData(id, sn, active) {
    this.id = id;
    this.sn = sn;
    this.active = active;
}

// Return PollIntervalData for specific SN
function getPollIntervalData(sn) {
    for (var i = 0; i < pollIntervals.length; i++) {
        var pollData = pollIntervals[i];
        if (pollData.sn == sn)
            return pollData;
    }

    return null;
}

// Process ACKs received from Receiver
function handleAck(receivedAck) {
    log("Sender: Received - " + receivedAck.text());

    var nextExpectedSn = expectedSqNo(receivedAck);
    var receivedAckType = frameType(receivedAck);

    // Process ACK Final=1 frame
    if (receivedAckType == "ackFinalFrame") {
        goBackN(nextExpectedSn);
        receivedAck.remove();
        return;
    }

    // Process ACK Final=1 frame
    if (receivedAckType == "ackREJFrame") {
        sendInfoFrame(sequenceNo(receivedAck));
        receivedAck.remove();
        return;
    }

    //Process RR frame and mark readyFrame to transmittedFrame
    for (var i = 0; i < nextExpectedSn; i++) {
        var sfSlot = sfSlots[i];
        if (frameType(sfSlot) != 'transmittedFrame') {
            var sn = sequenceNo(sfSlot);
            clearPollTimerIntervalsBySn(sn);
            sfSlot.removeClass("readyFrame").addClass("transmittedFrame");
            sfSlot.removeAttr("title").attr("title", "Transmission Confirmed.");
        }
    }

    // When RR Ack received for the most last frame, no need to proceed further
    if (Number(nextExpectedSn) >= Number(totalFrames)) {
        receivedAck.remove();
        log("Done.");
        clearWindow();
        clearTimerIntervals();
        return;
    }

    //Slide window
    slideWindow();

    // Remove the Ack from buffer
    receivedAck.remove();
}

//Go back to expected SN slot and transmit frame from there
function goBackN(expectedSn) {
    for (var i = expectedSn; i <= windowSm; i++) {
        sendInfoFrame(i);
    }
}

// Used to slide window
function slideWindow() {
    ++windowSb;
    ++windowSm;

    if (Number(windowSm) >= Number(totalFrames)) {
        windowSm = totalFrames - 1;
        return; // Done
    }

    windowPanel.animate({
        left: sfSlots[windowSb].position().left + 2
    }, 50);
    sendInfoFrame(windowSm); //After a slide, send a info frame
}





/***
 *
 *
 *   ////////////////////// 3. RECEIVER functions goes below //////////////////////
 *
 */



//Receiver - Process received frame
function receiver(receivedFrame) {

    //Process Poll frame
    if (frameType(receivedFrame) == "ackPollFrame") {
        handlePollCmd(receivedFrame);
        return;
    }

    // Process info frame
    var sn = sequenceNo(receivedFrame);

    //Check whether frame is damaged or not
    if (isDamagedFrame(receivedFrame)) { //Dicard damaged frame
        log("Receiver: Received damaged " + receivedFrame.text() + " - Discarding.");
        sendAck(receivedFrame, "REJ"); // Send REJ ACK for received frame
        receivedFrame.remove();
        return;
    }

    //Discard frame if SN does not match with expected SN
    if (rcvrExptedSn != sn) {
        log("Receiver: Discarded - " + receivedFrame.text());
        receivedFrame.remove();
        return;
    }

    //Proceed when SN matches and not a duplicate frame
    log("Receiver: Received - " + receivedFrame.text());
    ++rcvrExptedSn; //Increase the received expected sequence number
    sendAck(receivedFrame, "RR"); // Send ACK for received frame
    sendInfoFrameToUpperLayer(receivedFrame); //  Transfer frame to upper layer
    rfSlots[sn].removeClass("expectedFrame").addClass("receivedFrame"); // Change the status of the frame (color)
    receivedFrame.remove(); //Remove the frame from receiver buffer

}

//Receiver - create RR ACK frame and transmit
function sendAck(receivedFrame, ackType) {

    // Get the frame SN
    var sn = sequenceNo(receivedFrame);

    // Create RR ACK frame
    var ackFrameType = "";
    if (ackType == "RR")
        ackFrameType = "ackRRFrame"
    else
        ackFrameType = "ackREJFrame";

    var ack = createFrame(ackFrameType, ackType + " " + rcvrExptedSn, sn, rcvrExptedSn);

    //Receiver transmits RR Ack frame into medium
    transmitFrame(ack, rfSlots[0].position().top, rfSlots[sn].position().left);

    // Start propagation, medium calls sender on delivery
    propagateFrame(ack, senderAddress(), function() {
        handleAck($(this));
    });

}


function handlePollCmd(receivedFrame) {
    log("Receiver: Received -" + receivedFrame.text());

    // Read and remove Ack poll frame from buffer
    receivedFrame.remove();

    // Create RR ACK frame
    var ack = createFrame("ackFinalFrame", "RR" + rcvrExptedSn + " F", sequenceNo(receivedFrame), rcvrExptedSn);

    //Receiver puts Ack frame into medium
    var sn = sequenceNo(receivedFrame);
    transmitFrame(ack, rfSlots[sn].position().top, rfSlots[sn].position().left);

    // Start propagation, medium calls sender on delivery
    propagateFrame(ack, senderAddress(), function() {
        handleAck($(this));
    });

}


//Send frame to upper layer
function sendInfoFrameToUpperLayer(receivedFrame) {
    // Sending the frame to upper layer for further processing
    //log("Receiver: Upper layer received - " + receivedFrame.text());
}