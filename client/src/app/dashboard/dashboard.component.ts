import { Component, OnInit, OnDestroy } from '@angular/core';
import { SocketService } from '../socket.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {

  constructor(private socketService: SocketService) { }

  ngOnInit(): void {
    const self = this;
    self.socketService.connect();
  }

  ngOnDestroy() {
    const self = this;
    self.socketService.disconnect();
  }
}
