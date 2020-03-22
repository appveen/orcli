import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { APIOptions, ApiService } from 'src/app/api.service';

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.scss']
})
export class TasksComponent implements OnInit {

  @ViewChild('createTaskModel', { static: false }) createTaskModel: TemplateRef<HTMLElement>;
  form: FormGroup;
  selectedLog: any;
  taskList: Array<any>;
  apiOptions: APIOptions;
  createTaskModelRef: NgbModalRef;
  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private toastr: ToastrService,
    private modal: NgbModal) {
    const self = this;
    self.taskList = [];
    self.apiOptions = {
      page: 1,
      count: 30
    };
    self.form = self.fb.group({
      name: [null, [Validators.required]],
      repo: [null, [Validators.required]],
      branch: [null, [Validators.required]],
      cron: [null],
      script: [null],
      sshKey: [null],
      lastBuild: [null]
    });
  }

  ngOnInit(): void {
    const self = this;
    self.fetchBuilds();
  }

  fetchBuilds() {
    const self = this;
    self.api.get('tasks', '/', self.apiOptions).subscribe((res: any) => {
      self.taskList = res;
    }, err => {
      self.toastr.error(err.error.message);
    });
  }

  openCreateTaskModal() {
    const self = this;
    self.createTaskModelRef = self.modal.open(self.createTaskModel);
    self.createTaskModelRef.result.then(close => {

    }, dismiss => {

    });
  }

  triggerCreate() {
    const self = this;
    self.api.post('tasks', '/', self.form.value).subscribe((res: any) => {
      self.taskList = res;
    }, err => {
      self.toastr.error(err.error.message);
    });
  }
}
