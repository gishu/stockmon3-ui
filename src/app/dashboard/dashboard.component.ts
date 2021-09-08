import { Component, OnInit } from '@angular/core';

import { Gain } from '../viewModel/gain';
import { HoldingSummary } from '../viewModel/holdingSummary';
import { StockmonService } from '../stockmon.service';

import * as _ from 'lodash';
import { BigNumber } from 'bignumber.js';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'mx-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  // the grid contents
  gains: Gain[] = [];

  years: any[] = [];
  accounts: any[] = [];
  selectedYear: any = 0;
  selectedAccountId: any = 0;

  totalGain = 0;
  totalTCO = 0;

  constructor(private stockService: StockmonService) {}

  ngOnInit(): void {
    
    this.accounts = [3, 2, 1];
    this.selectedAccountId = this.accounts[0];
    this.getYears(this.selectedAccountId);
  }

  refreshSummary(gains: Gain[]) {
    this.totalTCO =
      gains.reduce(
        (total, item: Gain) => total + item.qty * item.cost_price,
        0
      ) / 1000;
    this.totalGain =
      gains.reduce((total, item: Gain) => total + item.gain, 0) / 1000;
  }

  getYears(accountId : any){
    this.stockService.getYearsWithTradesFor(accountId).then((years: number[])  => {
      this.years = years;
      if (this.years.length > 0){
        this.selectedYear = this.years[0];
      }
    })
    
  }
}
