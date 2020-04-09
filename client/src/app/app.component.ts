import { Component, OnInit } from '@angular/core';
import { SocketService } from './socket.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'client';

  constructor(private socketService: SocketService) {
    const self = this;
  }

  ngOnInit() {
    const self = this;
    self.socketService.connect();
  }
}
