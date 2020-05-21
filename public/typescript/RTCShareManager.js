var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var ConnectionManager = /** @class */ (function () {
    function ConnectionManager(ws, options) {
        var _this_1 = this;
        this.userID = "user1";
        this.dublicate = null;
        this.myAudioSharingStatus = false;
        this.myVideoSharingStatus = false;
        this.myAudioReceiveStatus = false;
        this.myVideoReceiveStatus = false;
        this.videoReceivePermission = true;
        this.connections = [];
        this.datachannels = [];
        this.room = {
            keyType: 0,
            key: "test"
        };
        this.JOINROOM = "join room";
        this.UPDATECLIENTLISTINIATE = "initiate clientlist update";
        this.UPDATECLIENTLIST = "update client list";
        this.SENDOFFER = "send offer";
        this.SENDANSWER = "send answer";
        this.SENDCANDIDATE = "send candidate";
        this.CLIENTDISCONNECT = "client disconnect";
        this.UPDATEAUDIOSTATUS = "update audio status";
        this.options = options;
        this.chatDisplayArea = document.getElementById(this.options.html_elements.chat_display_area);
        this.videoElement = document.getElementById(this.options.html_elements.screen_share_area);
        if (ws) {
            this.socket = ws;
        }
        else {
            this.socket = new WebSocketLogic(this.room, this.userID);
            this.socket.startWebSocketConnection();
        }
        this.myID = this.socket.getUserId();
        this.socket.registerSignalHandler(function (signalData) { return __awaiter(_this_1, void 0, void 0, function () {
            var i, newConnection_1, object1_1, object2, id_1, newDatachannel, that, i, object, i, object, id, i, i, object, object;
            var _this_1 = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.myID = this.socket.getUserId();
                        if (signalData.data.event == this.UPDATECLIENTLISTINIATE) {
                            this.socket.sendSignal({
                                room: this.room,
                                data: {
                                    sender: this.myID,
                                    event: this.UPDATECLIENTLIST,
                                    liveStatus: this.liveModeStatus,
                                },
                            });
                        }
                        if (signalData.data.event == this.UPDATECLIENTLIST && signalData.data.sender !== this.myID) {
                            if (signalData.data.liveStatus && this.liveModeStatus) {
                                if (this.connections.length) {
                                    for (i = 0; i < this.connections.length; i++) {
                                        if (signalData.data.sender == this.connections[i].client.id) {
                                            this.dublicate = this.connections[i].client.id;
                                            // console.log("dublicate found");
                                            return [2 /*return*/];
                                        }
                                    }
                                }
                                newConnection_1 = new Connection(signalData.data.sender, this.options);
                                this.connections.push(newConnection_1);
                                object1_1 = newConnection_1.client.connectionObjects.object1;
                                object2 = newConnection_1.client.connectionObjects.object2;
                                id_1 = newConnection_1.client.id;
                                newDatachannel = {
                                    id: newConnection_1.client.id,
                                    datachannel: object1_1.createDataChannel("" + id_1 + "")
                                };
                                this.datachannels.push(newDatachannel);
                                newDatachannel.datachannel.onopen = function () {
                                    console.log("datachannel is open");
                                    console.log("--------------------------");
                                    _this_1.updateChat({
                                        datachannels: _this_1.datachannels
                                    });
                                };
                                newDatachannel.datachannel.onclose = function () {
                                    console.log("datachannel " + id_1 + " closed");
                                };
                                // also works in firefox
                                object1_1.oniceconnectionstatechange = function (event) {
                                    _this_1.onConnectionStatusChange(object1_1, id_1);
                                    if (typeof options.event_handlers.on_connection_status_change === 'function') {
                                        options.event_handlers.on_connection_status_change({
                                            connection: newConnection_1,
                                            state: object1_1.iceConnectionState
                                        });
                                    }
                                };
                                object1_1.onicecandidate = function (event) {
                                    if (event.candidate) {
                                        var candidate = event.candidate;
                                        var type = "1";
                                        _this_1.socket.sendSignal({
                                            room: _this_1.room,
                                            data: {
                                                Sender: _this_1.myID,
                                                Candidate: candidate,
                                                Type: type,
                                                Receiver: id_1,
                                                event: _this_1.SENDCANDIDATE
                                            }
                                        });
                                    }
                                };
                                object2.onicecandidate = function (event) {
                                    if (event.candidate) {
                                        var candidate = event.candidate;
                                        var type = "2";
                                        _this_1.socket.sendSignal({
                                            room: _this_1.room,
                                            data: {
                                                Sender: _this_1.myID,
                                                Candidate: candidate,
                                                Type: type,
                                                Receiver: id_1,
                                                event: _this_1.SENDCANDIDATE
                                            }
                                        });
                                    }
                                };
                                object2.ontrack = function (event) { return __awaiter(_this_1, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        console.log(event.track);
                                        if (event.track.kind === "video") {
                                            console.log("GOT VIDEOTRACK");
                                            if (this.videoReceivePermission == true) {
                                                this.onReceiveVideo({
                                                    event: event,
                                                    id: newConnection_1.client.id,
                                                    connection: newConnection_1,
                                                    connections: this.connections,
                                                });
                                                this.changeStatusHandler("video", "receive", true, id_1);
                                                return [2 /*return*/];
                                            }
                                            else if (this.videoReceivePermission == false) {
                                                console.log("permission for video was not granted");
                                                return [2 /*return*/];
                                            }
                                        }
                                        else if (event.track.kind === "audio") {
                                            console.log("got audiotrack");
                                            this.changeStatusHandler("audio", "receive", true, id_1);
                                            this.onReceiveAudio({
                                                event: event,
                                                id: newConnection_1.client.id,
                                                connection: newConnection_1,
                                                connections: this.connections
                                            });
                                        }
                                        return [2 /*return*/];
                                    });
                                }); };
                                object1_1.onnegotiationneeded = function (event) {
                                    if (object1_1.signalingState == "stable") {
                                        console.log("IM NEGOTIATING WITH " + id_1);
                                        _this_1.createOffers(object1_1, id_1);
                                    }
                                };
                                that = this;
                                object2.ondatachannel = function (event) {
                                    event.channel.addEventListener("message", function (ev) {
                                        var data = null;
                                        try {
                                            data = JSON.parse(ev.data);
                                        }
                                        catch (e) { }
                                        that.onReceiveMessage({
                                            message: data
                                        });
                                        if (typeof options.event_handlers.on_receive_message === 'function') {
                                            options.event_handlers.on_receive_message({
                                                message: data
                                            });
                                        }
                                    });
                                };
                                console.log("eventhandlers set");
                                console.log("--------------------------");
                            }
                            else {
                                return [2 /*return*/];
                            }
                        }
                        if (signalData.data.event == this.SENDOFFER && signalData.data.Receiver == this.myID) {
                            for (i = 0; i < this.connections.length; i++) {
                                if (this.connections[i].client.id == signalData.data.Sender) {
                                    object = this.connections[i].client.connectionObjects.object2;
                                    this.setRemote(object, "offer", signalData.data.Offer, this.connections[i].client.id);
                                }
                            }
                        }
                        if (signalData.data.event == this.SENDANSWER && signalData.data.Receiver == this.myID) {
                            for (i = 0; i < this.connections.length; i++) {
                                if (this.connections[i].client.id == signalData.data.Sender) {
                                    object = this.connections[i].client.connectionObjects.object1;
                                    this.setRemote(object, "answer", signalData.data.Answer, this.connections[i].client.id);
                                }
                            }
                        }
                        if (signalData.data.event == this.CLIENTDISCONNECT && signalData.sender !== this.myID) {
                            id = signalData.sender;
                            for (i = 0; i < this.connections.length; i++) {
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
                        if (!(signalData.data.event == this.SENDCANDIDATE && signalData.data.Receiver == this.myID)) return [3 /*break*/, 6];
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < this.connections.length)) return [3 /*break*/, 6];
                        if (!(this.connections[i].client.id == signalData.data.Sender)) return [3 /*break*/, 5];
                        if (!(signalData.data.Type == "1")) return [3 /*break*/, 3];
                        object = this.connections[i].client.connectionObjects.object2;
                        return [4 /*yield*/, object.addIceCandidate(signalData.data.Candidate)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        if (!(signalData.data.Type == "2")) return [3 /*break*/, 5];
                        object = this.connections[i].client.connectionObjects.object1;
                        return [4 /*yield*/, object.addIceCandidate(signalData.data.Candidate)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/];
                }
            });
        }); });
    }
    ConnectionManager.prototype.startConnection = function (liveModeStatus) {
        this.liveModeStatus = liveModeStatus;
        this.socket.sendSignal({
            room: this.room,
            data: {
                ID: this.myID,
                event: this.UPDATECLIENTLISTINIATE,
                liveStatus: liveModeStatus
            }
        });
    };
    //handles all sharestatus changes of RTCPeerConnections
    ConnectionManager.prototype.changeStatusHandler = function (shareType, role, state, id) {
        console.log("changing statuses for " + id);
        for (var i = 0; i < this.connections.length; i++) {
            if (this.connections[i].client.id == id) {
                this.client = this.connections[i].client;
                this.changeStatus(shareType, role, state, id);
            }
        }
    };
    ConnectionManager.prototype.changeStatus = function (shareType, role, state, id) {
        if (shareType == "audio") {
            if (role == "send") {
                console.log("changing receive status(audio) of" + id + " to " + state);
                this.myAudioSharingStatus = state;
                this.client.receiveStatusAudio = this.myAudioSharingStatus;
                this.client = undefined;
            }
            else if (role == "receive") {
                console.log("changing share status(audio) of " + id + " to " + state);
                this.client.shareStatusAudio = state;
                this.client = undefined;
            }
        }
        else if (shareType == "video") {
            if (role == "send") {
                console.log("changing receive status(video) of " + id + " to " + state);
                this.myVideoSharingStatus = state;
                this.client.receiveStatusVideo = this.myVideoSharingStatus;
                this.client = undefined;
            }
            else if (role == "receive") {
                console.log("changing share status(video) of " + id + " to " + state);
                this.client.shareStatusVideo = state;
                this.client = undefined;
            }
        }
    };
    ConnectionManager.prototype.clientDisconnect = function () {
        this.nullShareStatuses();
        for (var i = 0; i < this.connections.length; i++) {
            var object1 = this.connections[i].client.connectionObjects.object1;
            var object2 = this.connections[i].client.connectionObjects.object2;
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
    };
    ConnectionManager.prototype.nullShareStatuses = function () {
        this.myAudioSharingStatus = undefined;
        this.myAudioReceiveStatus = undefined;
        this.myVideoSharingStatus = undefined;
        this.myVideoReceiveStatus = undefined;
    };
    ConnectionManager.prototype.onConnectionStatusChange = function (object, id) {
        if (object.iceConnectionState == "checking") {
            console.log("Checking...");
        }
        if (object.iceConnectionState == "failed" || object.iceConnectionState == "disconnected") {
            console.log("client " + id + " failed to connect");
            for (var i = 0; i < this.connections.length; i++) {
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
            for (var i = 0; i < this.connections.length; i++) {
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
        }
        else {
            return;
        }
    };
    ConnectionManager.prototype.checkForNewStates = function () {
        var _loop_1 = function (i) {
            var object = this_1.connections[i].client.connectionObjects.object1;
            var id = this_1.connections[i].client.id;
            if (object.iceConnectionState == "new") {
                _this = this_1;
                setTimeout(function () {
                    _this.removeHandler(object, id);
                }, 60000);
            }
        };
        var this_1 = this, _this;
        for (var i = 0; i < this.connections.length; i++) {
            _loop_1(i);
        }
    };
    ConnectionManager.prototype.removeHandler = function (object, id) {
        if (object.iceConnectionState == "new") {
            for (var i = 0; i < this.connections.length; i++) {
                if (this.connections[i].client.id == id) {
                    this.connections.splice(i, 1);
                    console.log("removed Connection for being in new-state for too long");
                    this.checkForNewStates();
                }
            }
        }
        else {
            return;
        }
    };
    //sets local description, creates offer and sends it to correct client
    ConnectionManager.prototype.createOffers = function (object, client) {
        return __awaiter(this, void 0, void 0, function () {
            var offer, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, object.createOffer()];
                    case 1:
                        offer = _a.sent();
                        return [4 /*yield*/, object.setLocalDescription(offer)];
                    case 2:
                        _a.sent();
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
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        console.log("Local(offer)[" + client + "]: " + error_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    //sets remote description based on type (offer or answer)
    //if type is 'answer' completes the handshake and checks if RTCPeerConnection object is connected succesfully
    ConnectionManager.prototype.setRemote = function (object, type, offer, id) {
        return __awaiter(this, void 0, void 0, function () {
            var answer, error_2, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(type == "offer")) return [3 /*break*/, 7];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        return [4 /*yield*/, object.setRemoteDescription(offer)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, object.createAnswer()];
                    case 3:
                        answer = _a.sent();
                        return [4 /*yield*/, object.setLocalDescription(answer)];
                    case 4:
                        _a.sent();
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
                        return [3 /*break*/, 6];
                    case 5:
                        error_2 = _a.sent();
                        console.log("Remote(offer)[" + id + "]: " + error_2);
                        return [3 /*break*/, 6];
                    case 6: return [3 /*break*/, 11];
                    case 7:
                        if (!(type == "answer")) return [3 /*break*/, 11];
                        _a.label = 8;
                    case 8:
                        _a.trys.push([8, 10, , 11]);
                        return [4 /*yield*/, object.setRemoteDescription(offer)];
                    case 9:
                        _a.sent();
                        return [3 /*break*/, 11];
                    case 10:
                        error_3 = _a.sent();
                        console.log("Remote(answer)[" + id + "]: " + error_3);
                        return [3 /*break*/, 11];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    return ConnectionManager;
}());
;
var Connection = /** @class */ (function () {
    function Connection(id, options) {
        console.log("client was created");
        this.configuration = {
            iceTransportPolicy: "relay",
            iceServers: options.ice_servers
        };
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
    return Connection;
}());
var RTCShareManager = /** @class */ (function () {
    function RTCShareManager(ws, options) {
        var _this_1 = this;
        this.isSharingAudio = false;
        this.isSharingVideo = false;
        this.liveModeStatus = false;
        this.options = options;
        this.aShare = new AudioSharing(this.options);
        this.videoShare = new VideoSharing(this.options);
        this.conMan = new ConnectionManager(ws, options);
        this.audioShareBtn = document.getElementById(this.options.buttons.audio_share);
        this.liveModeBtn = document.getElementById(this.options.buttons.live_mode);
        this.audioContainer = document.getElementById(this.options.html_elements.audio_container);
        this.chatOpenBtn = document.getElementById(this.options.buttons.chat_open_button);
        this.chatExit = document.getElementById(this.options.buttons.chat_exit_button);
        this.videoShareArea = document.getElementById(this.options.html_elements.video_container);
        this.videoShareBtn = document.getElementById(this.options.buttons.video_share_button);
        this.conMan.onReceiveAudio = function (args) {
            var audioStream = _this_1.aShare.receiveMedia(args.event, args.id, args.connections);
            if (typeof options.event_handlers.on_receive_audio === 'function') {
                options.event_handlers.on_receive_audio({
                    id: args.id,
                    stream: audioStream,
                    connection: args.connection
                });
            }
        };
        this.conMan.onReceiveVideo = function (args) {
            _this_1.videoShare.receiveMedia(args.event, args.id, args.connections);
            if (typeof options.event_handlers.on_receive_video === 'function') {
                options.event_handlers.on_receive_video({
                    type: 'start',
                    id: args.id,
                    connection: args.connection
                });
            }
        };
        this.conMan.startAudioShare = function (args) {
            _this_1.startAudioShare();
        };
        this.conMan.startVideoShare = function (args) {
            if (_this_1.isSharingVideo) {
                _this_1.shareEventType("continueVideoShare");
            }
            else if (!_this_1.isSharingVideo && _this_1.conMan.myVideoSharingStatus == true) {
                _this_1.startVideoShare();
            }
        };
        this.conMan.onReceiveMessage = function (args1) {
            _this_1.textChat.displayMessage(args1.message);
        };
        this.conMan.removeAudioPlayer = function (args) {
            _this_1.aShare.removeMediaPlayer(args.id);
        };
        this.conMan.removeVideoPlayer = function (args) {
            _this_1.videoShare.removeMediaPlayer(args.id);
        };
        this.conMan.updateChat = function (args) {
            _this_1.textChat.updateDatachannels(args.datachannels);
        };
        this.conMan.removeSenderAudio = function (args) {
            _this_1.aShare.removeMediaSender(args.id);
        };
        this.conMan.removeSenderVideo = function (args) {
            _this_1.videoShare.removeMediaSender(args.id);
        };
        this.conMan.removeDatachannel = function (args) {
            _this_1.textChat.removeDatachannel(args.id);
        };
    }
    RTCShareManager.prototype.setRoom = function (room) {
        this.conMan.room = room;
    };
    RTCShareManager.prototype.sendChatMessage = function (message) {
        if (this.textChat) {
            this.textChat.sendData(message);
        }
    };
    RTCShareManager.prototype.closeChat = function () {
        this.textChat.closeChat();
    };
    RTCShareManager.prototype.getChatMedia = function () {
        this.textChat.getMedia(this.conMan.datachannels, this.conMan.myID);
    };
    RTCShareManager.prototype.liveMode = function () {
        if (typeof this.options.event_handlers.on_live_mode === 'function') {
            this.options.event_handlers.on_live_mode({
                isLive: !this.liveModeStatus
            });
        }
        if (!this.liveModeStatus) {
            this.liveModeStatus = true;
            this.conMan.startConnection(this.liveModeStatus);
            this.textChat = new Chat(this.options);
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
        }
        else {
            this.textChat.closeChat();
            this.stopLiveMode();
            this.liveModeStatus = false;
        }
    };
    RTCShareManager.prototype.stopLiveMode = function () {
        this.aShare.close();
        this.textChat.close();
        this.conMan.clientDisconnect();
        this.isSharingAudio = false;
        this.liveModeStatus = false;
        this.conMan.liveModeStatus = false;
        this.conMan.videoReceivePermission = true;
    };
    RTCShareManager.prototype.displayInConsole = function () {
        console.log(this.conMan.connections);
    };
    RTCShareManager.prototype.shareEventType = function (type) {
        var _this_1 = this;
        if (type == "video") {
            if (typeof this.options.event_handlers.on_video_share === 'function') {
                this.options.event_handlers.on_video_share({
                    isSharing: !this.isSharingVideo
                });
            }
            if (!this.isSharingVideo) {
                this.isSharingVideo = true;
                this.videoShare.getMedia(this.conMan.connections);
            }
            else {
                this.isSharingVideo = false;
                this.videoShare.close();
            }
        }
        if (type == "audio") {
            if (!this.isSharingAudio) {
                this.isSharingAudio = true;
                //change receive status of audio on all clients to true
                for (var i = 0; i < this.conMan.connections.length; i++) {
                    var id = this.conMan.connections[i].client.id;
                    this.conMan.changeStatusHandler("audio", "send", true, id);
                }
            }
            else if (this.isSharingAudio) {
                return;
            }
            this.aShare.getMedia(this.conMan.connections).then(function (stream) {
                var tracks = stream.getTracks();
                for (var _i = 0, tracks_1 = tracks; _i < tracks_1.length; _i++) {
                    var track = tracks_1[_i];
                    track.addEventListener('ended', function () {
                        _this_1.aShare.stopMediaSharing();
                    });
                }
                if (typeof _this_1.options.event_handlers.on_audio_share === 'function') {
                    _this_1.options.event_handlers.on_audio_share({
                        isSharing: true
                    });
                }
            }).catch(function (error) {
                _this_1.isSharingAudio = false;
                if (typeof _this_1.options.event_handlers.on_audio_share === 'function') {
                    _this_1.options.event_handlers.on_audio_share({
                        isSharing: false
                    });
                }
                console.error('Error sharing audio', error);
            });
        }
        if (type == "continueVideoShare") {
            this.videoShare.checkClientsForVideosharing();
        }
    };
    RTCShareManager.prototype.startAudioShare = function () {
        this.shareEventType("audio");
    };
    RTCShareManager.prototype.startVideoShare = function () {
        this.shareEventType("video");
    };
    return RTCShareManager;
}());
var Sharing = /** @class */ (function () {
    function Sharing() {
    }
    return Sharing;
}());
var DataSharing = /** @class */ (function (_super) {
    __extends(DataSharing, _super);
    function DataSharing() {
        return _super.call(this) || this;
    }
    return DataSharing;
}(Sharing));
var MediaSharing = /** @class */ (function (_super) {
    __extends(MediaSharing, _super);
    function MediaSharing() {
        return _super.call(this) || this;
    }
    return MediaSharing;
}(Sharing));
var AudioSharing = /** @class */ (function (_super) {
    __extends(AudioSharing, _super);
    function AudioSharing(options) {
        var _this_1 = _super.call(this) || this;
        _this_1.myTrack = null;
        _this_1.senders = [];
        _this_1.audioPlayers = [];
        _this_1.listCreated = false;
        _this_1.audioConstraints = {
            audio: true
        };
        _this_1.options = options;
        _this_1.audioContainer = document.getElementById(_this_1.options.html_elements.audio_container);
        _this_1.audioButton = document.getElementById(_this_1.options.buttons.audio_share);
        return _this_1;
    }
    //asks access to user microphone and adds audiotracks to correct RTCPeerConnection
    AudioSharing.prototype.getMedia = function (connections) {
        var _this_1 = this;
        this.connections = connections;
        if (this.myTrack) {
            this.attachTrackToConnections(this.myTrack, connections);
            return Promise.resolve(this.mediaDevice);
        }
        else {
            return navigator.mediaDevices.getUserMedia(this.audioConstraints).then(function (stream) {
                _this_1.mediaDevice = stream;
                _this_1.audioTracks = _this_1.mediaDevice.getAudioTracks();
                console.log("Using Audio device: " + _this_1.audioTracks[0].label);
                for (var _i = 0, _a = _this_1.audioTracks; _i < _a.length; _i++) {
                    var track = _a[_i];
                    _this_1.myTrack = track;
                    console.log("MY TRACK: " + _this_1.myTrack.id);
                }
                _this_1.attachTrackToConnections(_this_1.myTrack, connections);
                return stream;
            });
        }
    };
    AudioSharing.prototype.attachTrackToConnections = function (track, connections) {
        for (var i = 0; i < connections.length; i++) {
            var object = connections[i].client.connectionObjects.object1;
            var ID = connections[i].client.id;
            console.log('Audio+state', object.iceConnectionState);
            if (object.iceConnectionState === 'connected') {
                connections[i].client.receiveStatusAudio = true;
                if (!object.getSenders().length) {
                    var sender = object.addTrack(track);
                    this.rtpsender = {
                        type: "audio",
                        id: ID,
                        sender: sender
                    };
                    this.senders.push(this.rtpsender);
                }
            }
        }
    };
    AudioSharing.prototype.removeMediaPlayer = function (id) {
        if (this.audioContainer) {
            var audioPlayers = this.audioContainer.children;
            for (var i = 0; i < audioPlayers.length; i++) {
                var idAttribute = audioPlayers[i].getAttribute("data");
                if (id == idAttribute) {
                    this.audioContainer.removeChild(audioPlayers[i]);
                    console.log("audioplayer " + id + " removed");
                }
            }
        }
    };
    AudioSharing.prototype.removeMediaSender = function (id) {
        for (var i = 0; i < this.senders.length; i++) {
            if (this.senders[i].id == id) {
                this.senders.splice(i, 1);
                console.log("Sender for audio " + id + " Removed");
            }
        }
    };
    AudioSharing.prototype.close = function () {
        this.stopMediaSharing();
    };
    AudioSharing.prototype.stopMediaSharing = function () {
        if (this.audioTracks) {
            for (var i = 0; i < this.audioTracks.length; i++) {
                this.audioTracks[i].stop();
            }
        }
        if (this.myTrack) {
            this.myTrack.stop();
        }
        this.myTrack = null;
        for (var i = 0; i < this.senders.length; i++) {
            this.senders[i].sender.track.stop();
            this.senders[i].sender.track.enabled = true;
            var id = this.senders[i].id;
            this.removeMediaPlayer(id);
        }
        this.senders = [];
    };
    AudioSharing.prototype.receiveMedia = function (event, id, connections) {
        for (var i = 0; i < connections.length; i++) {
            if (connections[i].client.id == id) {
                connections[i].client.shareStatusAudio = true;
            }
        }
        var inboundStream = null;
        var audioPlayer = document.createElement("AUDIO");
        if (typeof this.options.event_handlers.create_audio_element === 'function') {
            this.options.event_handlers.create_audio_element({
                audio_container: this.audioContainer,
                audio_player: audioPlayer,
                id: id
            });
        }
        console.log(event.track);
        if (!inboundStream) {
            inboundStream = new MediaStream();
            audioPlayer.srcObject = inboundStream;
        }
        inboundStream.addTrack(event.track);
        return inboundStream;
    };
    return AudioSharing;
}(MediaSharing));
var VideoSharing = /** @class */ (function (_super) {
    __extends(VideoSharing, _super);
    function VideoSharing(options) {
        var _this_1 = _super.call(this) || this;
        _this_1.senders = [];
        _this_1.videoConstraints = {
            video: true
        };
        _this_1.options = options;
        _this_1.videoElement = document.getElementById(_this_1.options.html_elements.video_container);
        _this_1.videoButton = document.getElementById(_this_1.options.buttons.video_share);
        return _this_1;
    }
    VideoSharing.prototype.getMedia = function (connections, datachannels) {
        var _this_1 = this;
        this.datachannels = datachannels;
        this.connections = connections;
        var displayMediaOptions = {
            audio: false
        };
        if (!this.isSharingVideo) {
            return navigator.mediaDevices.getDisplayMedia(displayMediaOptions).then(function (stream) {
                console.log("Sharing video");
                _this_1.mediaDevice = stream;
                var videoTracks = _this_1.mediaDevice.getTracks();
                _this_1.isSharingVideo = true;
                _this_1.attachTrackToConnections(videoTracks);
                if (_this_1.connections) {
                    for (var i = 0; i < _this_1.connections.length; i++) {
                        _this_1.connections[i].client.receiveStatusVideo = true;
                    }
                }
                return stream;
            });
        }
        else {
            console.log("Already sharing video");
        }
    };
    VideoSharing.prototype.checkClientsForVideosharing = function () {
        console.log("checking clients..");
        /*
        if videosharing is on checks all clients who might not be receiving shared video
        and if founds one adds videotracks from existing stream to that client's RTCPeerconnection object
        */
        if (this.isSharingVideo) {
            for (var i = 0; i < this.connections.length; i++) {
                if (this.connections[i].client.receiveStatusVideo !== true) {
                    console.log("found a client who doesn't receive video yet!");
                    var object = this.connections[i].client.connectionObjects.object1;
                    var id = this.connections[i].client.id;
                    var videoTracks = this.mediaDevice.getVideoTracks();
                    for (var _i = 0, videoTracks_1 = videoTracks; _i < videoTracks_1.length; _i++) {
                        var track = videoTracks_1[_i];
                        var sender = object.addTrack(track);
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
    };
    VideoSharing.prototype.attachTrackToConnections = function (videoTracks) {
        return __awaiter(this, void 0, void 0, function () {
            var i, object, ID, _i, videoTracks_2, track, sender;
            return __generator(this, function (_a) {
                if (this.connections.length) {
                    for (i = 0; i < this.connections.length; i++) {
                        object = this.connections[i].client.connectionObjects.object1;
                        ID = this.connections[i].client.id;
                        for (_i = 0, videoTracks_2 = videoTracks; _i < videoTracks_2.length; _i++) {
                            track = videoTracks_2[_i];
                            this.myTrack = track;
                            console.log("MY VIDEOTRACK(Video): " + this.myTrack.id);
                            console.log("videotrack(Video) added");
                            sender = object.addTrack(this.myTrack);
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
                return [2 /*return*/];
            });
        });
    };
    VideoSharing.prototype.removeMediaSender = function (id) {
        for (var i = 0; i < this.senders.length; i++) {
            if (this.senders[i].id == id) {
                this.senders.splice(i, 1);
                console.log("Sender for video " + id + " Removed");
            }
        }
    };
    VideoSharing.prototype.receiveMedia = function (event, id, connections) {
        this.videoElement = document.getElementById(this.options.html_elements.screen_share_area);
        console.log(" VIDEO RECEIVED");
        var videoElement = this.videoElement.children;
        var inboundStream = null;
        var videoPlayer = document.createElement("VIDEO");
        if (typeof this.options.event_handlers.create_video_element === 'function') {
            this.options.event_handlers.create_video_element({
                video_container: this.videoElement,
                video_player: videoPlayer,
                id: id
            });
        }
        console.log(event.track);
        if (!inboundStream) {
            inboundStream = new MediaStream();
            videoPlayer.srcObject = inboundStream;
        }
        inboundStream.addTrack(event.track);
    };
    VideoSharing.prototype.close = function () {
        this.stopMediaSharing();
    };
    VideoSharing.prototype.stopMediaSharing = function () {
        if (this.videoTracks) {
            for (var i = 0; i < this.videoTracks.length; i++) {
                this.videoTracks[i].stop();
            }
        }
        if (this.myTrack) {
            this.myTrack.stop();
        }
        this.myTrack = null;
        for (var i = 0; i < this.senders.length; i++) {
            this.senders[i].sender.track.stop();
            this.senders[i].sender.track.enabled = true;
            var id = this.senders[i].id;
            this.removeMediaPlayer(id);
        }
        this.senders = [];
    };
    VideoSharing.prototype.removeMediaPlayer = function (id) {
        var videoplayers = this.videoElement.children;
        for (var i = 0; i < videoplayers.length; i++) {
            var idAttribute = videoplayers[i].getAttribute("data");
            if (id == idAttribute) {
                this.videoElement.removeChild(videoplayers[i]);
                console.log("videoplayer " + id + " removed");
            }
        }
    };
    return VideoSharing;
}(MediaSharing));
var Chat = /** @class */ (function (_super) {
    __extends(Chat, _super);
    function Chat(options) {
        var _this_1 = _super.call(this) || this;
        _this_1.unreadMessages = 0;
        _this_1.chatIsActive = false;
        _this_1.options = options;
        _this_1.chatOpenBtn = document.getElementById(_this_1.options.buttons.chat_open_button);
        _this_1.chatInput = document.getElementById(_this_1.options.html_elements.chat_input);
        _this_1.chatExit = document.getElementById(_this_1.options.buttons.chat_exit_button);
        _this_1.chatDisplayElement = document.getElementById(_this_1.options.html_elements.chat_display_area);
        _this_1.chatContainer = document.getElementById(_this_1.options.html_elements.chat_container);
        _this_1.chatNotification = document.getElementById(_this_1.options.html_elements.chat_notification);
        if (typeof _this_1.options.event_handlers.on_chat === 'function') {
            _this_1.options.event_handlers.on_chat({
                displayChat: true
            });
        }
        return _this_1;
    }
    Chat.prototype.getMedia = function (datachannels, myID) {
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
    };
    Chat.prototype.close = function () {
        this.closeChat();
    };
    Chat.prototype.updateDatachannels = function (datachannels) {
        this.datachannels = datachannels;
    };
    Chat.prototype.removeDatachannel = function (id) {
        for (var i = 0; i < this.datachannels.length; i++) {
            if (this.datachannels[i].id == id) {
                this.datachannels.splice(i, 1);
                console.log("datachannels removed");
            }
        }
    };
    Chat.prototype.sendData = function (message) {
        var messageObj = {
            "message": message,
            "id": this.myID
        };
        console.log(messageObj);
        if (this.chatDisplayElement) {
            var time = new Date().toLocaleTimeString("en-GB");
            var textContainer = document.createElement("div");
            textContainer.className = "myMessage";
            textContainer.innerHTML = message;
            textContainer.innerHTML += "<br />" + "[" + time + "]";
            this.chatDisplayElement.appendChild(textContainer);
        }
        for (var i = 0; i < this.datachannels.length; i++) {
            if (this.datachannels[i].datachannel.readyState == 'open') {
                this.datachannels[i].datachannel.send(JSON.stringify(messageObj));
            }
        }
    };
    Chat.prototype.displayMessage = function (messageObj) {
        // let receivedMessageObj = JSON.parse(messageObj);
        var message = messageObj.message;
        var id = messageObj.id;
        console.log("Received message from " + id);
        if (this.chatDisplayElement) {
            var time = new Date().toLocaleTimeString("en-GB");
            var textContainer = document.createElement("div");
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
    };
    Chat.prototype.addKeyEventListener = function () {
        var _this = this;
        if (_this.options.keys && _this.options.keys.send_message) {
            document.addEventListener('keydown', this.sendMessageFunction = function (event) {
                if (event.keyCode == _this.options.keys.send_message) {
                    event.preventDefault();
                    _this.handleSendingMessage();
                }
            });
        }
    };
    Chat.prototype.handleSendingMessage = function () {
        var message = this.checkMessage();
        if (message == undefined) {
            return;
        }
        else {
            this.sendData(message);
        }
    };
    Chat.prototype.removeKeyEventListener = function () {
        if (this.sendMessageFunction) {
            document.removeEventListener("keydown", this.sendMessageFunction);
        }
    };
    Chat.prototype.checkMessage = function () {
        var chatInputValue = this.chatInput.value;
        if (!chatInputValue.length || !chatInputValue.replace(/\s/g, '').length) {
            this.chatInput.value = "";
            return;
        }
        else {
            var trimmedValue = chatInputValue.trim();
            chatInputValue = trimmedValue;
            this.chatInput.value = "";
            return chatInputValue;
        }
    };
    Chat.prototype.closeChat = function () {
        this.chatIsActive = false;
        if (typeof this.options.event_handlers.on_chat === 'function') {
            this.options.event_handlers.on_chat({
                minimize: true
            });
        }
        this.removeKeyEventListener();
    };
    return Chat;
}(DataSharing));
var WebSocketLogic = /** @class */ (function () {
    function WebSocketLogic(room, userID) {
        this.room = room;
        this.userID = userID;
    }
    WebSocketLogic.prototype.getUserId = function () {
        return this.myID;
    };
    WebSocketLogic.prototype.startWebSocketConnection = function () {
        var _this_1 = this;
        this.socket = io("https://example_url.fi:XXXXX", {
            reconnectionAttempts: 100,
            reconnectionDelay: 5000,
            reconnectionDelayMax: 20000,
            autoConnect: false
        });
        this.socket.connect();
        this.socket.on("connect", function () {
            console.log("Connected to the server");
            _this_1.myID = _this_1.socket.id;
            console.log("My ID is: " + _this_1.socket.id);
            console.log("--------------------------");
            _this_1.socket.emit("register", {
                room: _this_1.room,
                userId: _this_1.userID
            });
        });
    };
    WebSocketLogic.prototype.sendSignal = function (signal) {
        this.socket.emit("signal", signal);
    };
    WebSocketLogic.prototype.registerSignalHandler = function (handler) {
        this.socket.on("signal", handler);
    };
    return WebSocketLogic;
}());
