
//Global properties
var sSlots;// Sender frame slots or a queue	
var rSlots; // Receiver frame Slots or a queue
var totalFrames; //Total frames
var wdwPanel; // Sliding Window UI
var windowSize; // Sliding window size
var wdwSS; // Window start sequence
var wdwSMax; // Sliding window sequence maximum currently
var timeout; // Sender time out value to generate ACK POLL command
var speed; // Speed of the transmission (Animation)
var ExpectedSeq = 0; //Receiver expected sequence

var intervalPoll = []; // IDs of poll intervals
var timerID = []; // IDs of timer

$(document).ready(function() {

    // Start simulation on start button click
    $("#startBtn").click(function(event) {
        //event.preventDefault();

        //Initialize the app
        init();

        log("Starting simulator, please wait..");
        //Allow delay to user to select the sender frame slots to send damaged frame
        setTimeout(function() {
            sendStart();
        }, 1000);

    });

    // Refresh the entire page on stop request, this can be improved later without refreshing the complete page
    $("#stopBtn").click(function(event) {
        location.reload();
    });

});



// Read user entered properties and populate them into global properties
function readProperties() {
    totalFrames = $("#totalFrames").val();
    windowSize = $("#windowSize").val();
    timeout = $("#timeout").val();
    speed = $("#speed").val();
    wdwSS = 0;
    wdwSMax = windowSize - 1;
}

//Initialize the application state
function init() {
    clrConsole();
    cleanup();
    clearTimeout();
    readProperties();
    createFrSlots();
    createWdw();
    log("Initializing app...");
}



// Returns sender location (address)
function senderAddress() {
    var height = sSlots[0].position().top;
    return height;
}

// Returns receiver location (address)
function receiverAddress() {
    var height = rSlots[0].position().top;
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
function transmitFr(frame, topPos, leftPos) {
    //Put frame into medium
    frame.css({
        top: topPos,
        left: leftPos,
        position: "absolute"
    });
    $("#medium").append(frame);
}

//Propagate frame in medium
function propagateFr(frame, position, completeCallback) {
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
    sSlots = []; // Sender frame slots
    rSlots = []; // Receiver frame Slots
    wdwPanel = null;
    ExpectedSeq = 0; //Receiver expected sequence
    clrTimeIntervals(); // //Clear intervalPoll if anything running
}

//Create frame slots on sender and receier side to have them set up for communication
function createFrSlots() {
    for (var i = 0; i < totalFrames; i++) {

        //Create sender side frame slots   
        var sSlot = createFrUi("readyFrame", "Frame " + i, i, i);
        sSlot.attr("title", "Click to mark to damage.");

        sSlot.on("click", function() {
            log("User: " + $(this).text() + "- Marked to damage.");
            $(this).addClass("damagedFrame");
        });

        sSlots.push(sSlot);
        $("#sender").append(sSlot);


        //Create received side frame slots
        var rSlot = createFrUi("expectedFrame", "Frame " + i, i);
        rSlots.push(rSlot);
        $("#receiver").append(rSlot);
    }
}


// Extract sequence number from frame
function seqNo(frame) {
    return frame.attr("id");
}

// Extract expected sequence number from frame
function exptdSqNo(frame) {
    return frame.attr("name");
}


//Creates the requested frame
function createFr(frameStyle, text, seqNo, data) {
    var frame = createFrUi(frameStyle, text, seqNo, data);
    frame.attr("title", "Click to kill");

    // Kill frame by a click
    frame.on("click", function() {
        $(this).remove();
        log("Killed - " + $(this).text());
    });

    return frame;

}

// Create frame like UI
function createFrUi(frameStyle, text, seqNo, data) {
    var $frame = $("<span></span>");
    $frame.addClass("frame");
    $frame.addClass(frameStyle);
    $frame.text(text);
    $frame.attr("id", seqNo);
    $frame.attr("name", data);
    return $frame;
}

// Creates sliding window UI
function createWdw() {

    wdwPanel = $("<div></div>"); //Sliding Window
    wdwPanel.addClass("swindow");
    var sSlot = sSlots[wdwSS];
    var width = sSlot.outerWidth() * windowSize + windowSize * 10 + 2;
    wdwPanel.css("width", width);
    wdwPanel.css({
        top: sSlot.position().top - 10,
        left: sSlot.position().left,
        position: "absolute"
    });
    $("#medium").append(wdwPanel);
}

//When transmission of all frames done, just clear the window from view
function clearWdw() {
    wdwPanel.fadeOut(3000);
}


//Utility function to identify frame type
function frtype(frame) {
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
function clrConsole() {
    $("#console").empty();
}


//Sender - Starting the transmission from sender end
function sendStart() {
    log("Sender ready..");
    log("Receiver ready..");

    //Start transmitting the frames which all inside the window
    for (var i = 0; i < windowSize; i++) {
        var frame = createFr("infoFrame", "Frame " + i, i);
        sendInfoFr(i);
    }
}

// Sender - sending infoFrame
function sendInfoFr(sn) {

    // If frame has already been transmitted state, don't send again
    if (frtype(sSlots[sn]) == "transmittedFrame")
        return;

    //Create info frame
    var frame = createFr("infoFrame", "Frame " + sn, sn);

    //Simulate damaged frame
    if (isDamagedFrame(sSlots[sn])) {
        frame.addClass("damagedFrame");
        sSlots[sn].removeClass("damagedFrame");
    }

    log("Sender: Transmitting - " + frame.text());

    //Transmit frame into medium
    transmitFr(frame, sSlots[sn].position().top + 10, sSlots[sn].position().left);

    // Start propagation, call receiver when transmission completes      
    propagateFr(frame, receiverAddress(), function() {
        receiver($(this));
    });

    // Create Timer for each transmitted frame
    var timer = setTimeout(handleInfoFrTimeout, timeout, frame);
    timerID.push(timer);
}

//Sender - process time out when ACK is not received from receiver for a frame
function handleInfoFrTimeout(timedOutFrame) {

    var pollReceiver = function() {

        //Ignore timeout if ACK already received for frame
        var sn = seqNo(timedOutFrame);
        var frameSlotStatus = frtype(sSlots[sn]);
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
        var frame = createFr("ackPollFrame", "Ack Poll", sn);

        //Transmit ACK POLL frame into medium
        transmitFr(frame, sSlots[sn].position().top + 10, sSlots[sn].position().left);

        // Start propagation, call receiver when transmission completes      
        propagateFr(frame, receiverAddress(), function() {
            receiver($(this));
        });
    };

    //Sender polls receiver untill it receives RR Final=1
    var id = setInterval(pollReceiver, timeout);
    intervalPoll.push(new PollIntervalData(id, seqNo(timedOutFrame), 1));

}


function clrTimeIntervals() {

    //Clear timerID
    for (var i = 0; i < timerID.length; i++) {
        clearTimeout(timerID[i]);
    }

    //Clear intervalPoll
    for (var j = 0; j < intervalPoll.length; j++) {
        var pollData = intervalPoll[j];
        pollData.active = 0;
        clearInterval(pollData.id);
    }

    timerID = []; // Make empty
    intervalPoll = []; //Make empty

}

function clrPollTimeIntervalsBySn(sn) {

    //Clear intervalPoll
    for (var j = 0; j < intervalPoll.length; j++) {
       // var pollData = intervalPoll[j];
        //log("Clear - pollData = " + pollData.sn + " sn="+sn);
        if (intervalPoll[j].sn <=  Number(sn)) {
           // log("clrPollTimeIntervalsBySn - " + sn);
            intervalPoll[j].active = 0;
            clearInterval(intervalPoll[j].id);
           // window.alert("Stop");
        }
    }
}

// Check whether there is already active poll request in the window to prevernt over whelming of ACKPoll request
function isAnyPollIntervalActive(sn) {
    for (var i = 0; i < intervalPoll.length; i++) {
        var pollData = intervalPoll[i];
        
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
    for (var i = 0; i < intervalPoll.length; i++) {
        var pollData = intervalPoll[i];
        if (pollData.sn == sn)
            return pollData;
    }

    return null;
}

// Process ACKs received from Receiver
function handleAck(receivedAck) {
    log("Sender: Received - " + receivedAck.text());

    var nextExpectedSn = exptdSqNo(receivedAck);
    var receivedAckType = frtype(receivedAck);

    // Process ACK Final=1 frame
    if (receivedAckType == "ackFinalFrame") {
        goBackN(nextExpectedSn);
        receivedAck.remove();
        return;
    }

    // Process ACK Final=1 frame
    if (receivedAckType == "ackREJFrame") {
        sendInfoFr(seqNo(receivedAck));
        receivedAck.remove();
        return;
    }

    //Process RR frame and mark readyFrame to transmittedFrame
    for (var i = 0; i < nextExpectedSn; i++) {
        var sSlot = sSlots[i];
        if (frtype(sSlot) != 'transmittedFrame') {
            var sn = seqNo(sSlot);
            clrPollTimeIntervalsBySn(sn);
            sSlot.removeClass("readyFrame").addClass("transmittedFrame");
            sSlot.removeAttr("title").attr("title", "Transmission Confirmed.");
        }
    }

    // When RR Ack received for the most last frame, no need to proceed further
    if (Number(nextExpectedSn) >= Number(totalFrames)) {
        receivedAck.remove();
        log("Done.");
        clearWdw();
        clrTimeIntervals();
        return;
    }

    //Slide window
    slideWdw();

    // Remove the Ack from buffer
    receivedAck.remove();
}

//Go back to expected SN slot and transmit frame from there
function goBackN(expectedSn) {
    for (var i = expectedSn; i <= wdwSMax; i++) {
        sendInfoFr(i);
    }
}

// Used to slide window
function slideWdw() {
    ++wdwSS;
    ++wdwSMax;

    if (Number(wdwSMax) >= Number(totalFrames)) {
        wdwSMax = totalFrames - 1;
        return; // Done
    }

    wdwPanel.animate({
        left: sSlots[wdwSS].position().left + 2
    }, 50);
    sendInfoFr(wdwSMax); //After a slide, send a info frame
}


//Receiver - Process received frame
function receiver(receivedFrame) {

    //Process Poll frame
    if (frtype(receivedFrame) == "ackPollFrame") {
        handlePoll(receivedFrame);
        return;
    }

    // Process info frame
    var sn = seqNo(receivedFrame);

    //Check whether frame is damaged or not
    if (isDamagedFrame(receivedFrame)) { //Dicard damaged frame
        log("Receiver: Received damaged " + receivedFrame.text() + " - Discarding.");
        sendAck(receivedFrame, "REJ"); // Send REJ ACK for received frame
        receivedFrame.remove();
        return;
    }

    //Discard frame if SN does not match with expected SN
    if (ExpectedSeq != sn) {
        log("Receiver: Discarded - " + receivedFrame.text());
        receivedFrame.remove();
        return;
    }

    //Proceed when SN matches and not a duplicate frame
    log("Receiver: Received - " + receivedFrame.text());
    ++ExpectedSeq; //Increase the received expected sequence number
    sendAck(receivedFrame, "RR"); // Send ACK for received frame
    sendInfoFrToUpperLayer(receivedFrame); //  Transfer frame to upper layer
    rSlots[sn].removeClass("expectedFrame").addClass("receivedFrame"); // Change the status of the frame (color)
    receivedFrame.remove(); //Remove the frame from receiver buffer

}

//Receiver - create RR ACK frame and transmit
function sendAck(receivedFrame, ackType) {

    // Get the frame SN
    var sn = seqNo(receivedFrame);

    // Create RR ACK frame
    var ackfrtype = "";
    if (ackType == "RR")
        ackfrtype = "ackRRFrame"
    else
        ackfrtype = "ackREJFrame";

    var ack = createFr(ackfrtype, ackType + " " + ExpectedSeq, sn, ExpectedSeq);

    //Receiver transmits RR Ack frame into medium
    transmitFr(ack, rSlots[0].position().top, rSlots[sn].position().left);

    // Start propagation, medium calls sender on delivery
    propagateFr(ack, senderAddress(), function() {
        handleAck($(this));
    });

}


function handlePoll(receivedFrame) {
    log("Receiver: Received -" + receivedFrame.text());

    // Read and remove Ack poll frame from buffer
    receivedFrame.remove();

    // Create RR ACK frame
    var ack = createFr("ackFinalFrame", "RR" + ExpectedSeq + " F", seqNo(receivedFrame), ExpectedSeq);

    //Receiver puts Ack frame into medium
    var sn = seqNo(receivedFrame);
    transmitFr(ack, rSlots[sn].position().top, rSlots[sn].position().left);

    // Start propagation, medium calls sender on delivery
    propagateFr(ack, senderAddress(), function() {
        handleAck($(this));
    });

}


//Send frame to upper layer
function sendInfoFrToUpperLayer(receivedFrame) {
    // Sending the frame to upper layer for further processing
    //log("Receiver: Upper layer received - " + receivedFrame.text());
}
