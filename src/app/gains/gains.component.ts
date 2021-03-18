import { Component, OnInit, AfterViewInit, Input } from '@angular/core';

import { StockmonService } from '../stockmon.service';
import { Gain } from '../viewModel/gain';

@Component({
  selector: 'mx-gains',
  templateUrl: './gains.component.html',
  styleUrls: ['./gains.component.css'],
})
export class GainsComponent implements OnInit, AfterViewInit {
  private _accountId: number = -1;
  private _year: number = -1;

  private _viewLoaded: boolean = false;
  summaryKPIs: any = {};

  gridData: Gain[] = [];

  gridColumns = [
    'date',
    'stock',
    'quantity',
    'costPrice',
    'salePrice',
    'TCO',
    'gain',
    'type',
    'gainPercent',
    'cagr',
    'durationDays',
  ];

  @Input()
  set accountId(id: number) {
    this._accountId = id;

    if (!this._viewLoaded) {
      return;
    }

    this.refreshGrid();
  }

  @Input()
  set year(year: number) {
    this._year = year;
    if (!this._viewLoaded) {
      return;
    }

    this.refreshGrid();
  }

  constructor(private stockService: StockmonService) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this._viewLoaded = true;

    this.refreshGrid();
  }

  refreshGrid() {
    this.stockService.getGains(this._accountId, this._year).then((gains) => {
      this.gridData = gains;
      this.refreshSummary(this.gridData);
    });
  }

  refreshSummary(gains: Gain[]) {
    this.summaryKPIs.totalTCO =
      gains.reduce(
        (total, item: Gain) => total + item.qty * item.cost_price,
        0
      ) / 1000;
    this.summaryKPIs.totalGain =
      gains.reduce((total, item: Gain) => total + item.gain, 0) / 1000;
  }

  getColorCode(row : any) {
    return {
      nafaa: row.cagr > 0.25 && row.duration_days > 365,
      nuksaan: row.gain_percent < -0.08,
    };
  }
}
