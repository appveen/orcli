import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { ApiService, APIOptions } from 'src/app/api.service';

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
    private toastr: ToastrService) {
    const self = this;
    self.buildList = [];
    self.apiOptions = {
      page: 1,
      count: 30
    };
  }

  ngOnInit(): void {
    const self = this;
    self.fetchBuilds();
  }

  fetchBuilds() {
    const self = this;
    self.api.get('builds', '/', self.apiOptions).subscribe((res: any) => {
      self.buildList = res;
    }, err => {
      self.toastr.error(err.error.message);
    });
  }
}
