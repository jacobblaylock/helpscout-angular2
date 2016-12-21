import { Component, OnInit } from '@angular/core';

import { HelpscoutService } from './helpscout.service';
import { Observable } from 'rxjs/Rx';

@Component({
    moduleId: module.id,
    selector: 'my-app',
    templateUrl: 'app.component.html'
})
export class AppComponent implements OnInit {
    date = new Date();
    startDate: string = this.date.getFullYear() + '-' + this.date.getMonth() + '-01';
    endDate: string = this.date.getFullYear() + '-' + (this.date.getMonth()+1) + '-01';
    errorMessage: string;
    page: number;
    pages: number;
    count: number;
    conversations: any[] = [];
    threads: any[] = [];
    jobStatus: string;
    showPostThreads: boolean = true;
    dbConnStatus: string;
    dbConnStatusType: string;


    constructor(private _helpscout: HelpscoutService) { }

    ngOnInit() {
        this.checkDbConnection();
    }

    reset() {
        if(this.errorMessage){this.errorMessage = ''}
        if(this.page){ this.page = 0};
        if(this.pages){this.pages = 0};
        if(this.count){this.count = 0};
        if(this.conversations){this.conversations = []}
        if(this.threads){this.threads = []}
        if(this.jobStatus){this.jobStatus = ''}
    }

    getConvByDate(startDate: string, endDate: string): void {
        //Reset values
        this.reset();

        //Run Query
        this.startDate = startDate;
        this.endDate = endDate
        console.log('Get Helpscout conversations closed for the following dates:\nStart Date: ' + startDate + '\nEnd Date: ' + endDate);
        this._helpscout.searchConvByDate(startDate, endDate)
            .subscribe(
                data => {
                    this.count = data.count;
                    this.pages = data.pages;
                },
                error => this.errorMessage = <any>error
        );
    }

    getConvByDateAllPages() {
        let counter = 0;
        for(let i = 1; i <= this.pages; i++) {
            this._helpscout.searchConvByDate(this.startDate, this.endDate, i)
                .subscribe(
                    data => this.conversations = this.conversations.concat(data.items),
                    error => this.errorMessage = <any>error,
                    () => {
                        counter++;
                        if(counter === this.pages){
                            this.getConvDetails();
                        }
                    }
            );
        }
    }

    getConvDetails() {
        let counter = 0;
        for (let conv of this.conversations) {
            this._helpscout.searchThreadById(conv.id)
                .subscribe(
                    data => this.threads.push(data.item),
                    error => this.errorMessage = <any>error,
                    () => {
                        counter++;
                        if(counter === this.conversations.length){
                            //this.postThreadsToFile();
                            this.postThreadsToMysql();
                        }
                    }
                )
        }
    }

    postThreadsToFile() {
        this.showPostThreads = false;
        this._helpscout.postThreadsToFile(this.threads)
            .subscribe(
                data => this.jobStatus = data,
                error => this.errorMessage = <any>error
            )
    }

    postThreadsToMysql() {
        this.showPostThreads = false;
        this._helpscout.postThreadsToMysql(this.threads)
            .subscribe(
                data => this.jobStatus = data,
                error => this.errorMessage = <any>error
            )
    }

    checkDbConnection() {
        this.dbConnStatus = '';
        this.dbConnStatusType = '';
        this._helpscout.runCheckDbConnection()
            .subscribe(
                data => {
                    if(data === 'Connected'){
                        this.dbConnStatus = data;
                    }else{
                        this.dbConnStatus = 'Error connecting to the os_ticket database. Verify the source IP is whitelisted on BlueHost.   DETAILS:' + data;
                    }
                },
                error => this.errorMessage = <any>error,
                () => {
                    if(this.dbConnStatus === 'Connected') {
                        this.dbConnStatusType = 'alert alert-success';
                    }else{
                        this.dbConnStatusType = 'alert alert-danger';
                    }
                }
            )
    }
}