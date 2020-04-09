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
    self.socket = io('/', { path: '/socket' });
    self.socket.on('logs', function (data) {
      self.logs.emit(data);
    });
  }
}
