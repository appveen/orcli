import { Injectable, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import * as io from 'socket.io-client';


@Injectable({
  providedIn: 'root'
})
export class SocketService {

  socket: SocketIOClient.Socket;
  logs: EventEmitter<string>;
  constructor() {
    const self = this;
    self.logs = new EventEmitter();
    self.socket = io.connect('/', {
      path: '/socket',
      secure: true
    });
    self.socket.on('logs', function (data) {
      self.logs.emit(data);
    });
  }
}
