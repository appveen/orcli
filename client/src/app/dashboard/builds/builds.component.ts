import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { ApiService, APIOptions } from 'src/app/api.service';
import { SocketService } from 'src/app/socket.service';

@Component({
  selector: 'app-builds',
  templateUrl: './builds.component.html',
  styleUrls: ['./builds.component.scss']
})
export class BuildsComponent implements OnInit {

  selectedLog: any;
  buildList: Array<any>;
  apiOptions: APIOptions;
  constructor(
    private api: ApiService,
    private toastr: ToastrService,
    private socketService: SocketService) {
    const self = this;
    self.buildList = [];
    self.apiOptions = {
      page: 1,
      count: 30,
      sort: '-started'
    };
  }

  ngOnInit(): void {
    const self = this;
    self.fetchBuilds();
    self.socketService.logs.subscribe(data => {
      if (self.selectedLog && self.selectedLog._id === data._id) {
        self.selectedLog.logs += data.logs;
      }
    });
    self.socketService.buildStatus.subscribe(data => {
      if (self.selectedLog && self.selectedLog._id === data._id) {
        self.selectedLog.status = data.status;
      }
    });
  }

  fetchBuilds() {
    const self = this;
    self.api.get('builds', '/', self.apiOptions).subscribe((res: any) => {
      self.buildList = res;
    }, err => {
      self.toastr.error(err.error.message);
    });
  }

  refresh() {
    const self = this;
    self.api.get('builds', '/' + self.selectedLog._id).subscribe((res: any) => {
      self.selectedLog = res;
    }, err => {
      self.toastr.error(err.error.message);
    });
  }
}
