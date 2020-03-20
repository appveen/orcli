import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from 'src/app/api.service';

@Component({
  selector: 'app-hotfix',
  templateUrl: './hotfix.component.html',
  styleUrls: ['./hotfix.component.scss']
})
export class HotfixComponent implements OnInit {

  repoList: Array<any>;
  constructor(
    private api: ApiService,
    private toastr: ToastrService) {
    const self = this;
    self.repoList = [];
  }

  ngOnInit(): void {
    const self = this;
    self.fetchRepoList();
  }

  fetchRepoList() {
    const self = this;
    self.api.get('orcli', '/hotfix').subscribe((res: any) => {
      self.repoList = res;
    }, err => {
      self.toastr.error(err.error.message);
    });
  }
}
