import { Component, OnInit } from '@angular/core';
import { Gain } from '../domain/gain';
import { StockmonService } from '../stockmon.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  // the grid contents
  gains: Gain[] = [];

  years: any[] = [];
  selectedYear: any = 0;
  accounts: any[] = [];
  selectedAccount: any = 0;

  totalGain = 0;
  totalTCO = 0;

  constructor(private stockService: StockmonService) { }

  ngOnInit(): void {


    this.years = [{ year: 2020 }, { year: 2019 }, { year: 2018 }];
    this.accounts = [{ id: 3 }, { id: 2 }, { id: 1 }];
    this.selectedYear = this.years[0];
    this.selectedAccount = this.accounts[0]
    this.refreshGrid();
  }

  refreshSummary(gains: Gain[]) {
    this.totalTCO = gains.reduce((total, item: Gain) => total + (item.qty * item.cost_price), 0) / 1000;
    this.totalGain = gains.reduce((total, item: Gain) => total + item.gain, 0) / 1000;
  }
  refreshGrid() {
    this.stockService.getGains(this.selectedAccount.id, this.selectedYear.year).then(
      gains => {
        this.gains = gains;
        this.refreshSummary(this.gains);
      })
  }

  onFilter(event: any, table: any) {
    this.refreshSummary(event.filteredValue)
  }

  getButtonClass(numericValue : number) {
    return {
      'p-button-success': numericValue > 0,
      'p-button-danger': numericValue < 0
    };
  }
}
