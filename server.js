const express = require('express')
bodyParser = require('body-parser')
  https = require('https'),  
  request = require('request');

const app = express()


var registering = 0;
var findDonor = 0,
resisteringStep = 0,
findDonorStep = 0;
var userData = {};
var accessToken = "EAACvBDMN9tgBAN3N6J2YMtSZCZClFNyeX9jGCLu7LSDPUDBYKzxB5Bd8KtGj3WX31ZCMpHy1aVuFZAwkJTFgARtNf7hHOE5IwXn2BBv8fUKm1nXVvZBHCtvtInM4sQWuBzWG5q8fp1Y2TrrJ5tusX19z3dJ1BwwZCQwzSbgmBRowZDZD";


//app.use(bodyParser.json({ verify: verifyRequestSignature }));
app.use(bodyParser.json());

app.post('/', function (req, res) {
  var data = req.body;
  console.log(data);
  // Make sure this is a page subscription
  if (data.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.message) {
          receivedMessage(event);
        } else if(event.postback){
          receivedPostback(event);
        }
        else{
          console.log("Webhook received unknown event: ", event);
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know
    // you've successfully received the callback. Otherwise, the request
    // will time out and we will keep trying to resend.
    res.sendStatus(200);
  }
});
  
function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: "EAACvBDMN9tgBAN3N6J2YMtSZCZClFNyeX9jGCLu7LSDPUDBYKzxB5Bd8KtGj3WX31ZCMpHy1aVuFZAwkJTFgARtNf7hHOE5IwXn2BBv8fUKm1nXVvZBHCtvtInM4sQWuBzWG5q8fp1Y2TrrJ5tusX19z3dJ1BwwZCQwzSbgmBRowZDZD" },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s", 
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });  
}


function callUserDataAPI(senderId) {
  request('https://graph.facebook.com/v2.6/'+senderId+'?fields=first_name,last_name,profile_pic,locale,timezone,gender&access_token='+accessToken, 
    function(response,error,body) {
    //console.log(response.statusCode) // 200 
    //console.log(response) // 'image/png'
     body = JSON.parse(body);
    console.log(body.first_name);
  })

}


function getLocation(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
      message: {
        "text":"Please share your location where you can donate blood around:",
        "quick_replies":[
          {
            "content_type":"location",
          }
        ]
      }
  };

  callSendAPI(messageData);
}


function sendGenericMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "rift",
            subtitle: "Next-generation virtual reality",
            item_url: "https://www.oculus.com/en-us/rift/",               
            image_url: "http://messengerdemo.parseapp.com/img/rift.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/rift/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for first bubble",
            }],
          }, {
            title: "touch",
            subtitle: "Your Hands, Now in VR",
            item_url: "https://www.oculus.com/en-us/touch/",               
            image_url: "http://messengerdemo.parseapp.com/img/touch.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/touch/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for second bubble",
            }]
          }]
        }
      }
    },
  
  };  

  callSendAPI(messageData);
}

function receivedMessage(event)  {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:", 
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var messageId = message.mid;

  var messageText = message.text;
  var messageAttachments = message.attachments;

  if(registering){
    switch(resisteringStep){
      case 1:
        saveName(senderId,messageText);
        break;
      case 2:
        saveBloodGroup(senderId,messageText);
        break;
      case 3:
        getLocation(senderID);
    }
  }

  if (messageText) {

    // If we receive a text message, check to see if it matches a keyword
    // and send back the example. Otherwise, just echo the text we received.
    switch (messageText) {
      case 'hi':
      case 'hello':
      case 'Hi':
      case 'Hello':
        sendGreetingMessage(senderID);
        break;
      case 'generic':
        sendGenericMessage(senderID);
        break;
      case 'getData':
        callUserDataAPI(senderID);
        break;
      case 'loc':
        getLocation(senderID);
        break;

      default:
        sendTextMessage(senderID, messageText);
    }
  } else if (messageAttachments) {
    console.log(messageAttachments);
    switch(messageAttachments[0].type){
      case 'location':
        setLocation(senderID,messageAttachments[0].payload);
        break;
    }
    sendTextMessage(senderID, "Message with attachment received");
  }
  else if (event.postback) {
  	receivedPostback(event); 
  }
}

function setLocation(senderId,location) {
  sendTextMessage(senderId,"Your Location has been saved!");
  console.log(location);
  userData.loc = location.coordinates;

}

function saveName(senderId,Name) {
    sendTextMessage(senderId,"Hi "+Name);
    userData.Name = Name;
    sendTextMessage(senderId,"Please tell your Blood group.");
    resisteringStep++;
}

function saveName(senderId,Bloodgroup) {
    //sendTextMessage(senderID,"Your "+Name);
    //userData.Name = Name;
    sendTextMessage(senderID,"Please tell your Blood group.");
    resisteringStep++;
}

function sendGreetingMessage(recipientId) {
	
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: "Hi! I am Blood Donation bot. :D "
    }
  };

  callSendAPI(messageData);
  var messageData = {
    recipient: {
      id: recipientId
    },
      message: {
      "attachment":{
        "type":"template",
        "payload":{
          "template_type":"button",
          "text":"What do you want me to help you with today?",
          "buttons":[
            {
              "type":"web_url",
              "url":"https://petersapparel.parseapp.com",
              "title":"Show Website"
            },
            {
              "type":"postback",
              "title":"Start Chatting",
              "payload":"USER_DEFINED_PAYLOAD"
            }
          ]
        }
      }
    }
  };

  callSendAPI(messageData);
}

function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}

function receivedPostback(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  // The 'payload' param is a developer-defined field which is set in a postback 
  // button for Structured Messages. 
  var payload = event.postback.payload;

  console.log("Received postback for user %d and page %d with payload '%s' " + 
    "at %d", senderID, recipientID, payload, timeOfPostback);
  switch(payload){
    case 'GET_STARTED_PAYLOAD':
      sendGreetingMessage(senderID);
      break;
    case 'register':
      registerUser(senderID);
      break;

    case 'find_donor':
  }

  // When a postback is called, we'll send a message back to the sender to 
  // let them know it was successful
  sendTextMessage(senderID, "Postback called");
}

function registerUser(senderID) {
    sendTextMessage(senderID, "The setup proces is really simple and fast!! :O");
    sendTextMessage(senderID, "Please tell me your name");
    registering = 1;
    resisteringStep = 1;
}

app.get('/', function (req, res) {
  console.log(req.query);	
  res.send(req.query["hub.challenge"]);
})
app.listen((process.env.PORT || 3000), function () {
  console.log('Example app listening on port ' +(process.env.PORT || 3000) )
})