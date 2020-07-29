declare var io: any;
class ConnectionManager {

  private socket: IWebSocketClient;
  private options: any;
  private userID: string = "user1";
  private dublicate: string = null;
  private chatDisplayArea: HTMLElement;
  private videoElement: HTMLElement;
  private client: any;

  public myAudioSharingStatus: boolean = false;
  public myVideoSharingStatus: boolean = false;
  public myAudioReceiveStatus: boolean = false;
  public myVideoReceiveStatus: boolean = false;
  public videoReceivePermission: boolean = true;
  public myID: string;
  public liveModeStatus: boolean;
  public connections: Connection[] = [];
  public datachannels: IDatachannel[] = [];

  public onReceiveAudio: Function;
  public onReceiveVideo: Function;
  public startAudioShare: Function;
  public startVideoShare: Function;
  public removeAudioPlayer: Function;
  public removeVideoPlayer: Function;
  public sendScreenToClient: Function;
  public removeSenderAudio: Function;
  public removeSenderVideo: Function;
  public onReceiveMessage: Function;
  public updateChat: Function;
  public removeDatachannel: Function;

  room: IRoomInfo = {
    keyType: 0,
    key: "test"
  };

  readonly JOINROOM: string = "join room";
  readonly UPDATECLIENTLISTINIATE: string = "initiate clientlist update";
  readonly UPDATECLIENTLIST: string = "update client list";
  readonly SENDOFFER: string = "send offer";
  readonly SENDANSWER: string = "send answer";
  readonly SENDCANDIDATE: string = "send candidate";
  readonly CLIENTDISCONNECT: string = "client disconnect";
  readonly UPDATEAUDIOSTATUS: string = "update audio status";

  /**
   * Creates an instance of connection manager.
   * @author Joni Mustaniemi
   * @param ws Websocket client
   * @param options options for configuring UI
   */
  constructor(ws: IWebSocketClient, options: any) {
    this.options = options;
    this.chatDisplayArea = document.getElementById(this.options.html_elements.chat_display_area);
    this.videoElement = document.getElementById(this.options.html_elements.screen_share_area);

    // if Websocket client is not already instantiated, instantiate client and start websocket connection
    if (ws) {
      this.socket = ws;
    } else {
      this.socket = new WebSocketLogic(this.room, this.userID);
      this.socket.startWebSocketConnection();
    }
    this.myID = this.socket.getUserId();

    // registerSignalhandler for handling websocket events and signaling between clients until WebRTC connection has been established
    this.socket.registerSignalHandler(async (signalData: ISocketSignal) => {
      this.myID = this.socket.getUserId(); 

      if (signalData.data.event == this.UPDATECLIENTLISTINIATE) {

        // shares livemode status with other clients
        this.socket.sendSignal({
          room: this.room,
          data: {
            sender: this.myID,
            event: this.UPDATECLIENTLIST,
            liveStatus: this.liveModeStatus,
          },
        });
      }
      // checks for dublicate clients, if client already exists does not create another one
      if (signalData.data.event == this.UPDATECLIENTLIST && signalData.data.sender !== this.myID) {
        if (signalData.data.liveStatus && this.liveModeStatus) {
          if (this.connections.length) {
            for (let i = 0; i < this.connections.length; i++) {
              if (signalData.data.sender == this.connections[i].client.id) {
                this.dublicate = this.connections[i].client.id;
                return;
              }
            }
          }

          // creates new connection and tracks existing ones
          let newConnection = new Connection(signalData.data.sender, this.options);
          this.connections.push(newConnection);

          let object1: any = newConnection.client.connectionObjects.object1;
          let object2: any = newConnection.client.connectionObjects.object2;
          let id = newConnection.client.id;

          // creates datachannel for a client (linked via id) and tracks all existing datachannels
          let newDatachannel: IDatachannel = {
            id: newConnection.client.id,
            datachannel: object1.createDataChannel("" + id + "")
          };
          this.datachannels.push(newDatachannel);
          
          // sets eventhandlers for datachannels and connection objects
          newDatachannel.datachannel.onopen = () => {
            console.log("datachannel is open");
            console.log("--------------------------");

            // updates chats datachannels
            this.updateChat({
              datachannels: this.datachannels
            });
          }

          newDatachannel.datachannel.onclose = () => {
            console.log("datachannel " + id + " closed");
          }

          object1.oniceconnectionstatechange = (event) => {
            this.onConnectionStatusChange(object1, id);

            // in case you want to do something when the connection status changes -- PLACEHOLDER
            if (typeof options.event_handlers.on_connection_status_change === 'function') {
              options.event_handlers.on_connection_status_change({
                connection: newConnection,
                state: object1.iceConnectionState
              });
            }
          }

          // when candidate has been found, send it to the other client
          //    type 1 sends to 2
          //    type 2 sends to 1
          object1.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
            if (event.candidate) {
              let candidate = event.candidate;
              let type = "1";
              this.socket.sendSignal({
                room: this.room,
                data: {
                  Sender: this.myID,
                  Candidate: candidate,
                  Type: type,
                  Receiver: id,
                  event: this.SENDCANDIDATE
                }
              });
            }
          }

          object2.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
            if (event.candidate) {
              let candidate = event.candidate;
              let type = "2";
              this.socket.sendSignal({
                room: this.room,
                data: {
                  Sender: this.myID,
                  Candidate: candidate,
                  Type: type,
                  Receiver: id,
                  event: this.SENDCANDIDATE
                }
              });
            }
          }

          // when track has been added to the connection object:
          //    check kind
          //    check permissions
          //    change statuses to reflect current state
          //    do task based on type and permission eg. play video or display error because permission was not granted
          object2.ontrack = async (event: RTCTrackEvent) => {
            console.log(event.track);
            if (event.track.kind === "video") {
              console.log("GOT VIDEOTRACK");

              if (this.videoReceivePermission == true) {
                this.onReceiveVideo({
                  event: event,
                  id: newConnection.client.id,
                  connection: newConnection,
                  connections: this.connections,
                });
                this.changeStatusHandler("video", "receive", true, id);
                return;
              } else if (this.videoReceivePermission == false) {
                console.log("permission for video was not granted");
                return;
              }
            } else if (event.track.kind === "audio") {
              console.log("got audiotrack");
              this.changeStatusHandler("audio", "receive", true, id);
              this.onReceiveAudio({
                event: event,
                id: newConnection.client.id,
                connection: newConnection,
                connections: this.connections
              });
            }
          }
          
          // fires everytime connectionobjects finds out there is another connection object that it is not connected to
          //    if the state of the connection object is stable start negotiation eg. connection object is new or it has no on going negotiations
          object1.onnegotiationneeded = (event: Event) => {
            if (object1.signalingState == "stable") {
              console.log("IM NEGOTIATING WITH " + id);
              this.createOffers(object1, id);
            }
          }

          // when receiving connection object gets access to datachannel create event listeners for messages (Chat-functionality)
          var that = this;
          object2.ondatachannel = function (event: RTCDataChannelEvent) {
            event.channel.addEventListener("message", ev => {
              let data = null;
              try {
                data = JSON.parse(ev.data);
              } catch (e) {}
              that.onReceiveMessage({
                message: data
              });
              if (typeof options.event_handlers.on_receive_message === 'function') {
                options.event_handlers.on_receive_message({
                  message: data
                });
              }
            });
          }
          console.log("eventhandlers set");
          console.log("--------------------------");
        } else {
          return;
        }
      }

      // on receiving an offer checks that it's for me and if so sets the offer as remote description of the connection.
      if (signalData.data.event == this.SENDOFFER && signalData.data.Receiver == this.myID) {
        for (let i = 0; i < this.connections.length; i++) {
          if (this.connections[i].client.id == signalData.data.Sender) {
            let object = this.connections[i].client.connectionObjects.object2;
            this.setRemote(object, "offer", signalData.data.Offer, this.connections[i].client.id);
          }
        }
      }

      // on receiving an answer checks that it's for me and if so set the answer as the remote description of the connection
      if (signalData.data.event == this.SENDANSWER && signalData.data.Receiver == this.myID) {
        for (let i = 0; i < this.connections.length; i++) {
          if (this.connections[i].client.id == signalData.data.Sender) {
            let object = this.connections[i].client.connectionObjects.object1;
            this.setRemote(object, "answer", signalData.data.Answer, this.connections[i].client.id);
          }
        }
      }

      // in the case of client losing connection, close and disconnect everything
      if (signalData.data.event == this.CLIENTDISCONNECT && signalData.sender !== this.myID) {
        let id = signalData.sender;
        for (let i = 0; i < this.connections.length; i++) {
          if (this.connections[i].client.id == id) {
            this.connections[i].client.connectionObjects.object1.close();
            this.connections[i].client.connectionObjects.object2.close();
            this.connections.splice(i, 1);

            console.log("client " + id + " disconnected");
          }
          this.removeAudioPlayer({
            id: id
          });

          this.removeDatachannel({
            id: id
          });

          this.removeSenderAudio({
            id: id
          });

          this.removeSenderVideo({
            id: id
          });

          this.removeVideoPlayer({
            id: id
          });
        }
      }


      // on receiving a candidate check that it's for me and if so 
      //    check the type
      //        type 1 -> object 2
      //        type 2 -> object 1
      //    add candidate
      if (signalData.data.event == this.SENDCANDIDATE && signalData.data.Receiver == this.myID) {
        for (let i = 0; i < this.connections.length; i++) {
          if (this.connections[i].client.id == signalData.data.Sender) {
            if (signalData.data.Type == "1") {
              let object = this.connections[i].client.connectionObjects.object2;
              await object.addIceCandidate(signalData.data.Candidate);
            }
            if (signalData.data.Type == "2") {
              let object = this.connections[i].client.connectionObjects.object1;
              await object.addIceCandidate(signalData.data.Candidate);
            }
          }
        }
      }
    });
  }

 /**
  * @description Starts connection process by sharing livemode status with other clients
  * @author Joni Mustaniemi
  * @param liveModeStatus client's livemode state
  * @returns void
  */
 public startConnection(liveModeStatus): void {
    this.liveModeStatus = liveModeStatus;
    this.socket.sendSignal({
      room: this.room,
      data: {
        ID: this.myID,
        event: this.UPDATECLIENTLISTINIATE,
        liveStatus: liveModeStatus
      }
    });
  }

  /**
   * @description Handles client's status changes
   * @author Joni Mustaniemi
   * @param shareType audio or video
   * @param role receiving or sharing
   * @param state true or false
   * @param id identification string of the spesific client
   * @returns void
   */
  public changeStatusHandler(shareType: string, role: string, state: boolean, id: string): void {
    console.log("changing statuses for " + id);
    for (let i = 0; i < this.connections.length; i++) {
      if (this.connections[i].client.id == id) {
        this.client = this.connections[i].client;
        this.changeStatus(shareType, role, state, id);
      }
    }
  }

  /**
   * @description Changes state of the client
   * @author Joni Mustaniemi
   * @param shareType audio or video
   * @param role  receiving or sharing
   * @param state true or false
   * @param id identification string of the spesific client
   * @returns void
   */
  private changeStatus(shareType: string, role: string, state: boolean, id: string): void {
    if (shareType == "audio") {
      if (role == "send") {
        console.log("changing receive status(audio) of" + id + " to " + state);
        this.myAudioSharingStatus = state;
        this.client.receiveStatusAudio = this.myAudioSharingStatus;
        this.client = undefined;
      } else if (role == "receive") {
        console.log("changing share status(audio) of " + id + " to " + state);
        this.client.shareStatusAudio = state;
        this.client = undefined;
      }
    } else if (shareType == "video") {
      if (role == "send") {
        console.log("changing receive status(video) of " + id + " to " + state);
        this.myVideoSharingStatus = state;
        this.client.receiveStatusVideo = this.myVideoSharingStatus;
        this.client = undefined;
      } else if (role == "receive") {
        console.log("changing share status(video) of " + id + " to " + state);
        this.client.shareStatusVideo = state;
        this.client = undefined;
      }
    }
  }

  /**
   * @description Clients disconnect handler - If the client disconnects, close, null and disconnect everything
   * and send disconnect event to other clients so they know that another client have been disconnected
   * @author Joni Mustaniemi
   * @returns void
   */
  public clientDisconnect(): void {

    this.nullShareStatuses();

    for (let i = 0; i < this.connections.length; i++) {
      let object1 = this.connections[i].client.connectionObjects.object1;
      let object2 = this.connections[i].client.connectionObjects.object2;
      object1.close();
      object2.close();
    }

    this.datachannels = [];
    this.connections = [];

    this.socket.sendSignal({
      room: this.room,
      data: {
        event: this.CLIENTDISCONNECT
      },
      sender: this.myID
    });
  }

  /**
   * @description Nulls all statuses
   * @author Joni Mustaniemi
   * @returns void
   */
  private nullShareStatuses(): void {
    this.myAudioSharingStatus = undefined;
    this.myAudioReceiveStatus = undefined;
    this.myVideoSharingStatus = undefined;
    this.myVideoReceiveStatus = undefined;
  }

  /**
   * @description Determines what happens on different stages of the connection
   * @author Joni Mustaniemi
   * @param object the connection object
   * @param id identification string of the spesific client
   * @returns  void
   */
  private onConnectionStatusChange(object: RTCPeerConnection, id: string):  void {

    if (object.iceConnectionState == "checking") {
      console.log("Checking...");
    }

    if (object.iceConnectionState == "failed" || object.iceConnectionState == "disconnected") {
      console.log("client " + id + " failed to connect");
      for (let i = 0; i < this.connections.length; i++) {
        if (this.connections[i].client.id == id) {
          console.log("closing connection objects for " + id);
          this.connections[i].client.connectionObjects.object1.close();
          this.connections[i].client.connectionObjects.object2.close();
          this.connections.splice(i, 1);
        }
        this.removeAudioPlayer({
          id: id
        });

        this.removeSenderAudio({
          id: id
        });

        this.removeSenderVideo({
          id: id
        });

        this.removeVideoPlayer({
          id: id
        });

      }
      this.checkForNewStates();
    }

    if (object.iceConnectionState == "connected") {
      console.log("I'm connected to " + id + " successfully");
      for (let i = 0; i < this.connections.length; i++) {
        if (this.connections[i].client.id == id) {
          if (this.connections[i].client.receiveStatusAudio !== true) {
            console.log("SHARING AUDIO WITH " + id);

            this.startAudioShare({});
          }
          if (this.myVideoSharingStatus == true) {
            console.log("im not sharing video with " + id);
            this.startVideoShare();
            console.log("SHARING VIDEO WITH " + id);
          }
        }
      }

      if (typeof this.options.event_handlers.display_share_icons === 'function') {
        this.options.event_handlers.display_share_icons({});
      }
    } else {
      return;
    }
  }

  /**
   * @description Checks for new states among the connection objects
   * if connection object is in new state for too long it gets deleted
   * @author Joni Mustaniemi
   * @returns void
   */
  private checkForNewStates(): void {
    for (let i = 0; i < this.connections.length; i++) {
      let object = this.connections[i].client.connectionObjects.object1;
      let id = this.connections[i].client.id;
      if (object.iceConnectionState == "new") {
        var _this = this;
        setTimeout(function () {
          _this.removeHandler(object, id);
        }, 60000);
      }
    }
  }

  /**
   * @description removes connection from tracked connections for being in new state for too long
   * @author Joni Mustaniemi
   * @param object connection object
   * @param id identification string of the spesific client
   * @returns void
   */
  private removeHandler(object: RTCPeerConnection, id: string): void {
    if (object.iceConnectionState == "new") {
      for (let i = 0; i < this.connections.length; i++) {
        if (this.connections[i].client.id == id) {
          this.connections.splice(i, 1);
          console.log("removed Connection for being in new-state for too long");
          this.checkForNewStates();
        }
      }
    } else {
      return;
    }
  }

  /**
   * @description Creates offers, sets local description and sends offer to the correct client
   * @author Joni Mustaniemi
   * @param object connection object
   * @param client identification string of the spesific client
   * @returns promise
   */
  private async createOffers(object: RTCPeerConnection, client: string): Promise<void> {
    try {
      let offer = await object.createOffer();
      await object.setLocalDescription(offer);
      // reassurance that object is in correct state since recovering from wrong state is not possible
      if (object.signalingState == "have-local-offer") {
        this.socket.sendSignal({
          room: this.room,
          data: {
            Sender: this.myID,
            Offer: offer,
            Receiver: client,
            event: this.SENDOFFER
          }
        });
      }
    } catch (error) {
      console.log("Local(offer)[" + client + "]: " + error);
    }
  }

  /**
   * @description Sets remote description based on type (offer or answer)
   * if type is 'answer' completes the handshake and checks if RTCPeerConnection object is connected succesfully
   * if type is 'offer' sets remote description, creates answer and sends it to the correct client
   * @author Joni Mustaniemi
   * @param object connection object
   * @param type offer or answer
   * @param offer local description of another client
   * @param id identification string of the spesific client
   */
  private async setRemote(object: RTCPeerConnection, type: string, offer: RTCSessionDescription, id ? : string) {
    if (type == "offer") {
      try {
        await object.setRemoteDescription(offer);
        let answer = await object.createAnswer();
        await object.setLocalDescription(answer);
       
        if (object.signalingState == "stable") {
          this.socket.sendSignal({
            room: this.room,
            data: {
              Sender: this.myID,
              Answer: answer,
              Receiver: id,
              event: this.SENDANSWER
            }
          });
        }
      } catch (error) {
        console.log("Remote(offer)[" + id + "]: " + error);
      }
    } else if (type == "answer") {
      try {
        await object.setRemoteDescription(offer);
      } catch (error) {
        console.log("Remote(answer)[" + id + "]: " + error);
      }
    }
  }
}

export interface IRoomInfo {
  type ? : number;
  keyType: number;
  key: string;
}

export interface ISocketSignal {
  room: IRoomInfo;
  data: any;
  sender ? : string;
  receiver ? : string;
}

export interface IServerSignalHandlerCallbackDelegate {
  (data: ISocketSignal): void;
}

export interface IWebSocketClient {
  sendSignal(signal: ISocketSignal): void;
  registerSignalHandler(handler: IServerSignalHandlerCallbackDelegate): void;
  startWebSocketConnection(): void;
  getUserId(): string
}

interface IClient {
  id: string;
  connectionObjects: {
      object1: RTCPeerConnection;
      object2: RTCPeerConnection;
    },
    shareStatusAudio: boolean,
    shareStatusVideo: boolean,
    receiveStatusAudio: boolean,
    receiveStatusVideo: boolean,
  
}

interface IDatachannel {
  id: string;
  datachannel: RTCDataChannel;
};

/**
 * @description Connection Aka. Client
 * holds clients statuses, configurations and the client object itself
 * @author Joni Mustaniemi
 */
class Connection {

  private isSharingAudio: boolean;
  private isSharingVideo: boolean;
  private isReceivingAudio: boolean;
  private isReceivingVideo: boolean;
  private configuration: RTCConfiguration;

  public client: IClient;

  constructor(id: string, options: any) {
    console.log("client was created");

    // iceTransportPolicy can be used to limit the transport policies of the ICE candidates to be considered during the connection process
    // if this is not spesified, 'all' is assumed
    this.configuration = {
      iceTransportPolicy: "relay",
      iceServers: options.ice_servers
    };
    
    // the client object holds 2 RTCPeerCOnnection objects per client
    // 1 would be sufficient if 'rollback' functionality is used. it's not used by default and thus 2 objects are used
    // 1 for receiving (object2) and 1 for sending (object1)
    this.client = {
      id: id,
      connectionObjects: {
        object1: new RTCPeerConnection(this.configuration),
        object2: new RTCPeerConnection(this.configuration)
      },
      shareStatusAudio: this.isSharingAudio,
      shareStatusVideo: this.isSharingVideo,
      receiveStatusVideo: this.isReceivingVideo,
      receiveStatusAudio: this.isReceivingAudio,
      
    };
    
  }
}

/**
 * @description Manages and orchestrates all share events
 * @author Joni Mustaniemi
 */
class RTCShareManager {
  private audioShareBtn: HTMLElement;
  private videoShareBtn: HTMLElement;
  private liveModeBtn: HTMLElement;
  private audioContainer: HTMLElement;
  private chatOpenBtn: HTMLElement;
  private isSharingAudio: boolean = false;
  private isSharingVideo: boolean = false;
  private liveModeStatus: boolean = false;
  private conMan: ConnectionManager;
  private aShare: AudioSharing;
  private textChat: Chat;
  private chatExit: HTMLElement;
  private videoShare: VideoSharing;
  private videoShareArea: HTMLElement;
  private options: any;

  constructor(ws: IWebSocketClient, options: any) {
    this.options = options;
    this.aShare = new AudioSharing(this.options);
    this.videoShare = new VideoSharing(this.options);
    this.conMan = new ConnectionManager(
      ws,
      options,
    );

    this.audioShareBtn = document.getElementById(this.options.buttons.audio_share);
    this.liveModeBtn = document.getElementById(this.options.buttons.live_mode);
    this.audioContainer = document.getElementById(this.options.html_elements.audio_container);
    this.chatOpenBtn = document.getElementById(this.options.buttons.chat_open_button);
    this.chatExit = document.getElementById(this.options.buttons.chat_exit_button);
    this.videoShareArea = document.getElementById(this.options.html_elements.video_container);
    this.videoShareBtn = document.getElementById(this.options.buttons.video_share_button);
   
    this.conMan.onReceiveAudio = (args: any) => {
      var audioStream = this.aShare.receiveMedia(args.event, args.id, args.connections);

      if (typeof options.event_handlers.on_receive_audio === 'function') {
        options.event_handlers.on_receive_audio({
          id: args.id,
          stream: audioStream,
          connection: args.connection
        });
      }
    };

    this.conMan.onReceiveVideo = (args: any) => {
      this.videoShare.receiveMedia(args.event, args.id, args.connections);

      if (typeof options.event_handlers.on_receive_video === 'function') {
        options.event_handlers.on_receive_video({
          type: 'start',
          id: args.id,
          connection: args.connection
        });
      }
    };

    this.conMan.startAudioShare = (args: any) => {
      this.startAudioShare();
    };

    this.conMan.startVideoShare = (args: any) => {

      if (this.isSharingVideo) {
        this.shareEventType("continueVideoShare");
      } else if (!this.isSharingVideo && this.conMan.myVideoSharingStatus == true) {
        this.startVideoShare();
      }
    };



    this.conMan.onReceiveMessage = (args1: any) => {
      this.textChat.displayMessage(args1.message);
    };

    this.conMan.removeAudioPlayer = (args: any) => {
      this.aShare.removeMediaPlayer(args.id);
    };

    this.conMan.removeVideoPlayer = (args: any) => {
      this.videoShare.removeMediaPlayer(args.id);
    };

    this.conMan.updateChat = (args: any) => {
      this.textChat.updateDatachannels(args.datachannels);
    };

    this.conMan.removeSenderAudio = (args: any) => {
      this.aShare.removeMediaSender(args.id);
    };

    this.conMan.removeSenderVideo = (args: any) => {
      this.videoShare.removeMediaSender(args.id);
    };

    this.conMan.removeDatachannel = (args: any) => {
      this.textChat.removeDatachannel(args.id);
    };
  }
  
  /**
   * @description Sets websocket room
   * @author Joni Mustaniemi
   * @param room the websocket room name
   * @returns void
   */
  public setRoom(room: IRoomInfo): void {
    this.conMan.room = room;
  }

  /**
   * @description Sends chat message if the chat is active
   * @author Joni Mustaniemi
   * @param message user input to be sent
   * @returns void
   */
  public sendChatMessage(message: string): void {
    if (this.textChat) {
      this.textChat.sendData(message);
    }
  }

  /**
   * @description Closes chat
   * @author Joni Mustaniemi
   * @returns void
   */
  public closeChat(): void {
    this.textChat.closeChat();
  }

  /**
   * @description initializes chat, updates datachannels and client's id
   * @author Joni Mustaniemi
   * @returns void
   */
  public getChatMedia(): void {
    this.textChat.getMedia(this.conMan.datachannels, this.conMan.myID);
  }

/**
 * @description in order to receive and share data or media client must be in livemode
 * updates UI based on livemode
 * starts connection process if 2 or more clients are in livemode
 * @author Joni Mustaniemi
 * @returns void
 */
public liveMode(): void {
    if (typeof this.options.event_handlers.on_live_mode === 'function') {
      this.options.event_handlers.on_live_mode({
        isLive: !this.liveModeStatus
      });
    }

    // if livemode was not true, change livemode to true and start connection process
    if (!this.liveModeStatus) {
      this.liveModeStatus = true;
      this.conMan.startConnection(this.liveModeStatus);
      // instantiate chat so it is on by default as soon as connection is up
      this.textChat = new Chat(this.options);

      // can be used to set share events start on successful connection establish
      var behaviour = this.options.behaviour;
      if (behaviour && behaviour.live_mode) {
        if (behaviour.live_mode.audio_share) {
          this.startAudioShare();
        }
        if (behaviour.live_mode.screen_share_permission != null) {
          this.conMan.videoReceivePermission = this.options.behaviour.live_mode.screen_share_permission;
        }
        if (behaviour.live_mode.chat) {
          this.textChat.getMedia(this.conMan.datachannels, this.conMan.myID);
        }
      }
    } else {
      this.textChat.closeChat();
      this.stopLiveMode();
      this.liveModeStatus = false;
    }
  }


  /**
   * @description Stops live mode
   * @author Joni Mustaniemi
   * @returns void
   */
  private stopLiveMode(): void {
    this.aShare.close();
    this.textChat.close();
    this.conMan.clientDisconnect();
    this.isSharingAudio = false;
    this.liveModeStatus = false;
    this.conMan.liveModeStatus = false;
    this.conMan.videoReceivePermission = true;
  }

  /**
   * @description Displays tracked connections in console
   * used in debugging
   * @author Joni Mustaniemi
   * @returns void
   */
  public displayInConsole(): void {
    console.log(this.conMan.connections);
  }

  /**
   * @description handles media sharing and updates UI based on type
   * @author Joni Mustaniemi
   * @param type type of media e.g video or audio
   * @returns void
   */
  private shareEventType(type: string): void {
    if (type == "video") {
      if (typeof this.options.event_handlers.on_video_share === 'function') {
        this.options.event_handlers.on_video_share({
          isSharing: !this.isSharingVideo
        });
      }

      if (!this.isSharingVideo) {
        this.isSharingVideo = true;
        this.videoShare.getMedia(this.conMan.connections);
      } else {
        this.isSharingVideo = false;
        this.videoShare.close();
      }
    }

    // because audio is on by default (as soon as client enters LiveMode), changes all of the clients audio receive status to true
    if (type == "audio") {
      if (!this.isSharingAudio) {
        this.isSharingAudio = true;
        //change receive status of audio on all clients to true
        for (let i = 0; i < this.conMan.connections.length; i++) {
          let id = this.conMan.connections[i].client.id;
          this.conMan.changeStatusHandler("audio", "send", true, id);
        }
      } else if (this.isSharingAudio) {
        return;
      }

      // get media tracks and add event listener for track in case of 'ended' + updates the UI
      this.aShare.getMedia(this.conMan.connections).then((stream: MediaStream): void => {
        let tracks = stream.getTracks();
        for (const track of tracks) {
          track.addEventListener('ended', () => {
            this.aShare.stopMediaSharing();
          });
        }
        if (typeof this.options.event_handlers.on_audio_share === 'function') {
          this.options.event_handlers.on_audio_share({
            isSharing: true
          });
        }
      }).catch((error: any) => {
        this.isSharingAudio = false;
        if (typeof this.options.event_handlers.on_audio_share === 'function') {
          this.options.event_handlers.on_audio_share({
            isSharing: false
          });
        }
        console.error('Error sharing audio', error);
      });
    }
    // in case a client joins mid share re share the video to that client
    if (type == "continueVideoShare") {
      this.videoShare.checkClientsForVideosharing();
    }

  }

  /**
   * @description Starts audio share
   * @author Joni Mustaniemi
   * @returns void
   */
  public startAudioShare(): void {
    this.shareEventType("audio");
  }

  /**
   * @description Starts video share
   * @author Joni Mustaniemi
   * @returns void
   */
  public startVideoShare(): void {
    this.shareEventType("video");
  }

}

/**
 * @description An abstract class that can be used when expanding sharing functionality to minimize re writing existing code
 * @author Joni Mustaniemi
 */
abstract class Sharing {
  protected object: RTCPeerConnection;
}

/**
 * @description An abstract class that can be used when expanding datasharing functionality to minimize re writing existing code
 * @author Joni Mustaniemi
 */
abstract class DataSharing extends Sharing {
  constructor() {
    super();
  }
  public abstract getMedia(datachannels: IDatachannel[], param ? : any);
}

/**
 * @description An abstract class that can be used when expanding mediasharing functionality to minimize re writing existing code
 * @author Joni Mustaniemi
 */
abstract class MediaSharing extends Sharing {
  constructor() {
    super();
  }
  public abstract getMedia(connections: Connection[], datachannels ? : IDatachannel[]);
  protected abstract attachTrackToConnections(track: MediaStreamTrack, connections: Connection[]);
  protected abstract stopMediaSharing();
  protected abstract removeMediaPlayer(id: string);
  protected abstract removeMediaSender(id: string);
  protected abstract receiveMedia(event: RTCTrackEvent, id: string, connections: Connection[], datachannels ? : IDatachannel[]);


}

/**
 * @description Handles Audiosharing related things
 * @author Joni Mustaniemi
 */
class AudioSharing extends MediaSharing {

  protected object: RTCPeerConnection;

  private localStream: MediaStream;
  private mediaDevice: MediaStream;
  private options: any;
  private myTrack: MediaStreamTrack = null;
  private senders: any[] = [];
  private rtpsender: any;
  private audioTracks: MediaStreamTrack[];
  private audioPlayers: string[] = [];
  private connections: Connection[];
  private audioContainer: HTMLElement;
  private audioButton: HTMLElement;
  private listCreated: boolean = false;


  private audioConstraints: any = {
    audio: true
  };

  constructor(options ? : any) {
    super();
    this.options = options;
    this.audioContainer = document.getElementById(this.options.html_elements.audio_container);
    this.audioButton = document.getElementById(this.options.buttons.audio_share);
  }

  /**
   * @description asks access to user microphone and adds audiotracks to correct RTCPeerConnection
   * @author Joni Mustaniemi
   * @param connections list of tracked connections
   * @returns media 
   */
  public getMedia(connections: Connection[]): Promise < MediaStream > {
    this.connections = connections;

    if (this.myTrack) {
      this.attachTrackToConnections(this.myTrack, connections);
      return Promise.resolve(this.mediaDevice);
    } else {
      return navigator.mediaDevices.getUserMedia(this.audioConstraints).then((stream: MediaStream) => {
        this.mediaDevice = stream;
        this.audioTracks = this.mediaDevice.getAudioTracks();
        console.log("Using Audio device: " + this.audioTracks[0].label);

        for (const track of this.audioTracks) {
          this.myTrack = track;
          console.log("MY TRACK: " + this.myTrack.id);
        }
        this.attachTrackToConnections(this.myTrack, connections);
        return stream;
      });
    }
  }

  /**
   * @description Attachs tracks to connections
   * @author Joni Mustaniemi
   * @param track mediastream track
   * @param connections list of tracked connections
   * @returns void
   */
  protected attachTrackToConnections(track: MediaStreamTrack, connections: Connection[]): void {

    for (let i = 0; i < connections.length; i++) {
      let object = connections[i].client.connectionObjects.object1;
      let ID = connections[i].client.id;

      console.log('Audio+state', object.iceConnectionState);

      if (object.iceConnectionState === 'connected') {
        connections[i].client.receiveStatusAudio = true;

        if (!object.getSenders().length) {
          let sender = object.addTrack(track);
          this.rtpsender = {
            type: "audio",
            id: ID,
            sender: sender
          };
          this.senders.push(this.rtpsender);
        }
      }
    }
  }

  /**
   * @description Removes media player
   * @author Joni Mustaniemi
   * @param id identification string of the spesific client
   * @returns void
   */
  public removeMediaPlayer(id: string): void {
    if (this.audioContainer) {
      let audioPlayers = this.audioContainer.children;
      for (let i = 0; i < audioPlayers.length; i++) {
        let idAttribute = audioPlayers[i].getAttribute("data");
        if (id == idAttribute) {
          this.audioContainer.removeChild(audioPlayers[i]);
          console.log("audioplayer " + id + " removed");
        }
      }
    }

  }
  /**
   * @description Removes media sender for the media
   * @author Joni Mustaniemi
   * @param id identification string of the spesific client
   * @returns void
   */
  public removeMediaSender(id: string): void {
    for (let i = 0; i < this.senders.length; i++) {
      if (this.senders[i].id == id) {
        this.senders.splice(i, 1);
        console.log("Sender for audio " + id + " Removed");
      }
    }
  }

  /**
   * @description Closes audio sharing
   * @author Joni Mustaniemi
   * @returns void
   */
  public close(): void {
    this.stopMediaSharing();
  }

  /**
   * @description Stops media sharing
   * @author Joni Mustaniemi
   * @returns void
   */
  public stopMediaSharing(): void {
    if (this.audioTracks) {
      for (let i = 0; i < this.audioTracks.length; i++) {
        this.audioTracks[i].stop();
      }
    }

    if (this.myTrack) {
      this.myTrack.stop();
    }

    this.myTrack = null;

    for (let i = 0; i < this.senders.length; i++) {
      this.senders[i].sender.track.stop();
      this.senders[i].sender.track.enabled = true;
      let id = this.senders[i].id;
      this.removeMediaPlayer(id);
    }
    this.senders = [];
  }


  /**
   * @description Handles receiving audio
   * @author Joni Mustaniemi
   * @param event RTCTrackEvent
   * @param id identification string of the spesific client
   * @param connections list of tracked connections
   * @returns mediastream
   */
  public receiveMedia(event: RTCTrackEvent, id: string, connections: Connection[]): MediaStream {
    for (let i = 0; i < connections.length; i++) {
      if (connections[i].client.id == id) {
        connections[i].client.shareStatusAudio = true;
      }
    }

    let inboundStream = null;
    let audioPlayer: HTMLAudioElement = < HTMLAudioElement > document.createElement("AUDIO");

    if (typeof this.options.event_handlers.create_audio_element === 'function') {
      this.options.event_handlers.create_audio_element({
        audio_container: this.audioContainer,
        audio_player: audioPlayer,
        id: id
      });
    }
    // if mediastream already exists use that one, otherwise create one and set it to the audioplayer
    if (!inboundStream) {
      inboundStream = new MediaStream();
      audioPlayer.srcObject = inboundStream;
    }
    inboundStream.addTrack(event.track);
    return inboundStream;
  }
}

/**
 * @description Handles Videosharing related things
 * @author Joni Mustaniemi
 */
class VideoSharing extends MediaSharing {

  private options: any;
  private videoElement: HTMLElement;
  private connections: Connection[];
  private mediaDevice: MediaStream;
  private videoTracks: MediaStreamTrack[];
  private videoButton: HTMLElement;
  private myTrack: MediaStreamTrack;
  private senders: any[] = [];
  private rtpsender: any;
  private isSharingVideo: boolean;
  private datachannels: IDatachannel[];

  // set constraints for video e.g resolution
  private videoConstraints: any = {
    video: true
  };

  constructor(options: any) {
    super();
    this.options = options;
    this.videoElement = document.getElementById(this.options.html_elements.video_container);
    this.videoButton = document.getElementById(this.options.buttons.video_share);
  }

  /**
   * @description Gets video media
   * @author Joni Mustaniemi
   * @param connections list of tracked connections 
   * @param datachannels list of active datachannels
   * @returns media 
   */
  public getMedia(connections: Connection[], datachannels ? : IDatachannel[]): Promise < MediaStream > {
    this.datachannels = datachannels;
    this.connections = connections;
    // video configuration settings e.g audio on video or resolution
    var displayMediaOptions = {
      audio: false
    };

    if (!this.isSharingVideo) {
      return ( < any > navigator.mediaDevices).getDisplayMedia(displayMediaOptions).then((stream: MediaStream) => {
        console.log("Sharing video");

        this.mediaDevice = stream;

        let videoTracks = this.mediaDevice.getTracks();
        this.isSharingVideo = true;

        this.attachTrackToConnections(videoTracks);
        if (this.connections) {
          for (let i = 0; i < this.connections.length; i++) {
            this.connections[i].client.receiveStatusVideo = true;
          }
        }
        return stream;
      });
    } else {
      console.log("Already sharing video");
    }
  }
  /**
   * @description if videosharing is on checks all clients who might not be receiving shared video
   * and if founds one adds videotracks from existing stream to that client's RTCPeerconnection object
   * @author Joni Mustaniemi
   * @returns void
   */
  public checkClientsForVideosharing(): void {
    console.log("checking clients..");
  
    if (this.isSharingVideo) {
      for (let i = 0; i < this.connections.length; i++) {
        if (this.connections[i].client.receiveStatusVideo !== true) {
          console.log("found a client who doesn't receive video yet!");
          let object = this.connections[i].client.connectionObjects.object1;
          let id = this.connections[i].client.id;
          let videoTracks = this.mediaDevice.getVideoTracks();
          for (const track of videoTracks) {
            let sender = object.addTrack(track);
            this.connections[i].client.receiveStatusVideo = true;
            this.rtpsender = {
              type: "video",
              id: id,
              sender: sender
            };
            this.senders.push(this.rtpsender);
          }
        }
      }
    }
  }

  /**
   * @description Attachs media tracks to connections
   * @author Joni Mustaniemi
   * @param videoTracks media tracks
   * @returns void
   */
  public async attachTrackToConnections(videoTracks ? : any): Promise<void> {
    if (this.connections.length) {
      for (let i = 0; i < this.connections.length; i++) {
        let object = this.connections[i].client.connectionObjects.object1;
        let ID = this.connections[i].client.id;
        for (const track of videoTracks) {
          this.myTrack = track;
          console.log("MY VIDEOTRACK(Video): " + this.myTrack.id);

          console.log("videotrack(Video) added");
          let sender = object.addTrack(this.myTrack);
          this.rtpsender = {
            type: "video",
            id: ID,
            sender: sender
          };
          this.senders.push(this.rtpsender);
        }
        this.isSharingVideo = true;
        this.connections[i].client.receiveStatusVideo = true;
      }
    }
  }

  /**
   * @description Removes media senders for video
   * @author Joni Mustaniemi
   * @param id identification string of the spesific client
   * @returns void
   */
  public removeMediaSender(id): void {
    for (let i = 0; i < this.senders.length; i++) {
      if (this.senders[i].id == id) {
        this.senders.splice(i, 1);
        console.log("Sender for video " + id + " Removed");
      }
    }
  }

  /**
   * @description Handles receiving video media
   * @author Joni Mustaniemi
   * @param event RTCTrackEvent
   * @param id identification string of the spesific client
   * @param connections list of tracked connections
   * @returns void
   */
  public receiveMedia(event: RTCTrackEvent, id: string, connections: Connection[]): void {
    this.videoElement = document.getElementById(this.options.html_elements.screen_share_area);
    console.log(" VIDEO RECEIVED");

    let videoElement = this.videoElement.children;

    let inboundStream = null;
    let videoPlayer: HTMLVideoElement = < HTMLVideoElement > document.createElement("VIDEO");

    if (typeof this.options.event_handlers.create_video_element === 'function') {
      this.options.event_handlers.create_video_element({
        video_container: this.videoElement,
        video_player: videoPlayer,
        id: id
      });
    }
    // if mediastream already exists use that one, otherwise create one and set it to the audioplayer
    if (!inboundStream) {
      inboundStream = new MediaStream();
      videoPlayer.srcObject = inboundStream;
    }
    inboundStream.addTrack(event.track);
  }

  /**
   * @description Closes video sharing
   * @author Joni Mustaniemi
   * @returns void
   */
  public close(): void {
    this.stopMediaSharing();
  }
  /**
   * @description Stops media sharing
   * @author Joni Mustaniemi
   * @returns void
   */
  protected stopMediaSharing(): void {
    if (this.videoTracks) {
      for (let i = 0; i < this.videoTracks.length; i++) {
        this.videoTracks[i].stop();
      }
    }

    if (this.myTrack) {
      this.myTrack.stop();
    }

    this.myTrack = null;

    for (let i = 0; i < this.senders.length; i++) {
      this.senders[i].sender.track.stop();
      this.senders[i].sender.track.enabled = true;
      let id = this.senders[i].id;
      this.removeMediaPlayer(id);
    }
    this.senders = [];
  }

  /**
   * @description Removes media player
   * @author Joni Mustaniemi
   * @param id identification string of the spesific client
   * @returns void
   */
  public removeMediaPlayer(id: string): void {
    let videoplayers = this.videoElement.children;
    for (let i = 0; i < videoplayers.length; i++) {
      let idAttribute = videoplayers[i].getAttribute("data");
      if (id == idAttribute) {
        this.videoElement.removeChild(videoplayers[i]);
        console.log("videoplayer " + id + " removed");
      }
    }
  }
}

/**
 * @description Handles chat related things
 * @author Joni Mustaniemi
 */
class Chat extends DataSharing {

  private datachannels: any;
  private chatOpenBtn: HTMLElement;
  private chatInput: any;
  private chatDisplayElement: HTMLElement;
  private chatContainer: HTMLElement;
  private chatExit: HTMLElement;
  private chatNotification: HTMLElement;
  private myID: string;
  private unreadMessages: number = 0;
  private sendMessageFunction: any;
  private options: any;
  private chatIsActive: boolean = false;

  constructor(options: any) {
    super();
    this.options = options;
    this.chatOpenBtn = document.getElementById(this.options.buttons.chat_open_button);
    this.chatInput = document.getElementById(this.options.html_elements.chat_input);
    this.chatExit = document.getElementById(this.options.buttons.chat_exit_button);
    this.chatDisplayElement = document.getElementById(this.options.html_elements.chat_display_area);
    this.chatContainer = document.getElementById(this.options.html_elements.chat_container);
    this.chatNotification = document.getElementById(this.options.html_elements.chat_notification);

    //chats initial state in UI or at the moment of initialization
    if (typeof this.options.event_handlers.on_chat === 'function') {
      this.options.event_handlers.on_chat({
        displayChat: true
      });
    }
  }

  /**
   * @description Gets chat media and sets chat active
   * @author Joni Mustaniemi
   * @param datachannels list of active datachannels
   * @param myID client's id
   * @returns void
   */
  public getMedia(datachannels: any, myID: string): void {
    this.datachannels = datachannels;
    this.myID = myID;

    this.chatIsActive = true;
    if (typeof this.options.event_handlers.on_chat === 'function') {
      this.options.event_handlers.on_chat({
        isActive: true
      });
    }

    this.unreadMessages = 0;
    this.chatNotification.innerHTML = JSON.stringify(this.unreadMessages);

    this.chatInput.focus();
    this.addKeyEventListener();
  }

  /**
   * @description Closes chat
   * @author Joni Mustaniemi
   * @returns void
   */
  public close(): void {
    this.closeChat();
  }

  /**
   * @description Updates datachannels
   * @author Joni Mustaniemi
   * @param datachannels list of active datachannels
   * @returns void
   */
  public updateDatachannels(datachannels: IDatachannel[]): void {
    this.datachannels = datachannels;
  }

  /**
   * @description Removes datachannel
   * @author Joni Mustaniemi
   * @param id identification string of the spesific client
   * @returns void
   */
  public removeDatachannel(id): void {
    for (let i = 0; i < this.datachannels.length; i++) {
      if (this.datachannels[i].id == id) {
        this.datachannels.splice(i, 1);
        console.log("datachannels removed");
      }
    }
  }

  /**
   * @description Sends data and updates UI to show message (own)
   * @author Joni Mustaniemi
   * @param message message to be sent
   * @returns void
   */
  public sendData(message: string): void {
    let messageObj = {
      "message": message,
      "id": this.myID
    }

    if (this.chatDisplayElement) {
      let time = new Date().toLocaleTimeString("en-GB");
      let textContainer = document.createElement("div");
      textContainer.className = "myMessage";
      textContainer.innerHTML = message;
      textContainer.innerHTML += "<br />" + "[" + time + "]";
      this.chatDisplayElement.appendChild(textContainer);
    }

    for (let i = 0; i < this.datachannels.length; i++) {
      if (this.datachannels[i].datachannel.readyState == 'open') {
        this.datachannels[i].datachannel.send(JSON.stringify(messageObj));
      }
    }
  }

  /**
   * @description Displays chat message from another client
   * @author Joni Mustaniemi
   * @param messageObj message object from another client, includes message and id
   * @returns void
   */
  public displayMessage(messageObj: any): void {
    // let receivedMessageObj = JSON.parse(messageObj);
    let message = messageObj.message;
    let id = messageObj.id;
    console.log("Received message from " + id);


    if (this.chatDisplayElement) {
      let time = new Date().toLocaleTimeString("en-GB");
      let textContainer = document.createElement("div");
      textContainer.classList.add("receivedMessage");
      textContainer.innerHTML = message;
      textContainer.innerHTML += "<br />" + "[" + time + "]";
      this.chatDisplayElement.appendChild(textContainer);

      if (!this.chatIsActive) {
        this.unreadMessages++;
        this.chatNotification.innerHTML = JSON.stringify(this.unreadMessages);
        if (typeof this.options.event_handlers.on_chat === 'function') {
          this.options.event_handlers.on_chat({
            showNotification: true
          });
        }
      }
    }
  }

/**
 * @description Adds key event listener for key defined in options that when pressed sends the message
 * @author Joni Mustaniemi
 * @returns void
 */
private addKeyEventListener(): void {
    var _this = this;
    if (_this.options.keys && _this.options.keys.send_message) {
      document.addEventListener('keydown', this.sendMessageFunction = function (event) {
        if (event.keyCode == _this.options.keys.send_message) {
          event.preventDefault();
          _this.handleSendingMessage();
        }
      });
    }
  }

  /**
   * @description Handles sending message
   * @author Joni Mustaniemi
   * @returns void
   */
  private handleSendingMessage(): void {
    let message = this.checkMessage();
    if (message == undefined) {
      return;
    } else {
      this.sendData(message);
    }
  }

  /**
   * @description Removes key event listener
   * @author Joni Mustaniemi
   * @returns void
   */
  private removeKeyEventListener(): void {
    if (this.sendMessageFunction) {
      document.removeEventListener("keydown", this.sendMessageFunction);
    }
  }

  /**
   * @description Validates message
   * @author Joni Mustaniemi
   * @returns string
   */
  private checkMessage(): string {
    let chatInputValue = this.chatInput.value;
    if (!chatInputValue.length || !chatInputValue.replace(/\s/g, '').length) {
      this.chatInput.value = "";
      return;
    } else {
      let trimmedValue = chatInputValue.trim();
      chatInputValue = trimmedValue;
      this.chatInput.value = "";
      return chatInputValue;
    }
  }
  /**
   * @description Closes chat
   * @author Joni Mustaniemi
   * @returns void
   */
  public closeChat(): void {
      this.chatIsActive = false;
      if (typeof this.options.event_handlers.on_chat === 'function') {
        this.options.event_handlers.on_chat({
          minimize: true
        });
      }
      this.removeKeyEventListener();
    }
  }

/**
 * @description Handles Websocket client
 * @author Joni Mustaniemi
 */
class WebSocketLogic implements IWebSocketClient {
  private socket: any;
  private myID: string;
  private room: IRoomInfo;
  private userID: string;

  constructor(room: IRoomInfo, userID: string) {
    this.room = room;
    this.userID = userID;
  }

  /**
   * @description Gets user id
   * @author Joni Mustaniemi
   * @returns string
   */
  public getUserId(): string {
    return this.myID;
  }

  /**
   * @description Starts websocket connection
   * @author Joni Mustaniemi
   * @returns void
   */
  public startWebSocketConnection(): void {
    this.socket = io("https://example_url.fi:XXXXX", {
      reconnectionAttempts: 100,
      reconnectionDelay: 5000,
      reconnectionDelayMax: 20000,
      autoConnect: false
    });

    this.socket.connect();
    this.socket.on("connect", () => {
      console.log("Connected to the server");
      this.myID = this.socket.id;
      console.log("My ID is: " + this.socket.id);
      console.log("--------------------------");
      this.socket.emit("register", {
        room: this.room,
        userId: this.userID
      });
    });
  }

  /**
   * @description Sends signal via websocket
   * @author Joni Mustaniemi
   * @param signal Websocket signal
   */
  public sendSignal(signal: ISocketSignal): void {
    this.socket.emit("signal", signal);
  }

  /**
   * @description Registers signal handler
   * @author Joni Mustaniemi
   * @param handler Server signal handler
   * @returns void
   */
  public registerSignalHandler(handler: IServerSignalHandlerCallbackDelegate): void {
    this.socket.on("signal", handler);
  }
}