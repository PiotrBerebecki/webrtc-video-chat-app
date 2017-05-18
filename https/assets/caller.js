/* global document, EndPoint */
const VideoEndPoint = (function() {
  /** @class VideoEndPoint
     *  @description Specialisation of the generic EndPoint. Each instance of this class
     *  represents an actual video UI end point.
   */
  class VideoEndPoint extends EndPoint {
    constructor(ep_name, remoteVideoTag, localVideoTag, statusTag) {
      super(ep_name);
      this._remoteVideoTag = remoteVideoTag;
      this._localVideoTag = localVideoTag;
      this._statusTag = statusTag;
      this._state = 'IDLE';
      this._onCallWith = null;
      this._localMediaPromise = null;

      this.attachMedia();
    }

    attachMedia() {
      if (this._localMediaPromise == null) {
        this._localMediaPromise = navigator.mediaDevices.getUserMedia({
          // audio: true,
          video: true,
        });

        this._localMediaPromise
          .then(mediaStream => {
            this._localVideoTag.srcObject = mediaStream;
            this._localVideoTag.play();
          })
          .catch(err => console.log('video not working', err));
      }
    }

    setState(newState) {
      this._statusTag.innerText = newState;
      this._state = newState;
    }

    makeCall(callTargetName, data) {
      if (EndPoint.names[callTargetName]) {
        // Only make a call if not already calling someone else
        if (this._state === 'IDLE') {
          this._onCallWith = callTargetName;
          this.setState('CALLING');
          this.send(callTargetName, 'CALL_REQUEST', data);
        }
      } else {
        console.log('Please enter a valid name');
        return;
      }
    }

    acceptCall() {
      this.send(this._onCallWith, 'ACCEPT_CALL');
      this.setState('CALLED');
    }

    hangUp() {
      this.setState('IDLE');
      this.send(this._onCallWith, 'END_CALL');
    }
    /** @method receive
         *  @description Entry point called by the base class when it receives a message for this object from another EndPoint.
         *  @param {String} from - the directory name of the remote EndPoint that sent this request
         *  @param {String} operation - the text string identifying the name of the method to invoke
         *  @param {Object} [data] - the opaque parameter set passed from the remote EndPoint to be sent to the method handler
         */
    // Provide the required 'receive' method
    receive(from, operation, data) {
      this.log(
        'END POINT RX PROCESSING... (' + from + ', ' + operation + ')',
        data
      );
      switch (operation) {
        case 'CALL_REQUEST': {
          this._onCallWith = from;
          if (this._state === 'IDLE') {
            this.acceptCall();
          } else {
            this.send(this._onCallWith, 'DENIED');
          }
          break;
        }
        case 'DENIED':
          this.setState('IDLE');
          break;
        case 'ACCEPT_CALL':
          this.setState('ONTHEPHONE');
          break;
        case 'SDP_OFFER':
          break;
        case 'SDP_ANSWER': {
          this.send(from, 'SDP_OFFER', { a: 'hey to you too' });
          break;
        }
        case 'ICE_CANDIDATE':
          break;
        case 'END_CALL':
          this.setState('IDLE');
          break;
      }
    }
    /** @method hangupCall
         *  @description The localEndPoint (THIS) wants to terminate the call. This is generally the result of the user
         *  clicking the hang-up button. We call our local 'endCall' method and then send 'END_CALL' to the remote party.
         */
    hangupCall() {}
    /** @method startCall
         *  @description The user wants to make a call to a remote EndPoint (target). This first part of the process
         *  is to send a message to the target to request the call. The remote EndPoint may accept the call by sending
         *  'ACCEPT_CALL' or decline the call by sending 'DENIED'. Nothing happens at our end other than to send the
         *  message requesting the call. The actuall call is set up if the remote station accepts and sends 'ACCEPT_CALL'.
         *
         *  If the local EndPoint (this) is already in a call (_state is NOT IDLE) then we refuse to start another call.
         *  @param {String} target - the name of the remote party that we want to start a call with
         */
    startCall(target) {}
  }
  return VideoEndPoint;
})();
