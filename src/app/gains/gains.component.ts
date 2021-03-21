import {
  Component,
  OnInit,
  AfterViewInit,
  Input,
  ViewChild,
} from '@angular/core';

import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

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

  gridData: any = [];

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
  filterCriteria: string =  "";

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

  @ViewChild(MatSort) sort: MatSort;

  constructor(private stockService: StockmonService) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this._viewLoaded = true;

    this.refreshGrid();
  }

  refreshGrid() {
    this.stockService.getGains(this._accountId, this._year).then((gains) => {
      
      this.gridData = new MatTableDataSource(gains);
      this.gridData.sort = this.sort;
      
      this.refreshKpis(gains);
    });
  }

  refreshKpis(gains: Gain[]) {
    this.summaryKPIs.totalTCO =
      gains.reduce(
        (total, item: Gain) => total + item.qty * item.cost_price,
        0
      ) / 1000;
    this.summaryKPIs.totalGain =
      gains.reduce((total, item: Gain) => total + item.gain, 0) / 1000;
  }

  getColorCode(row: any) {
    return {
      nafaa: row.cagr > 0.25 && row.duration_days > 30,
      nuksaan: row.gain_percent < -0.08,
    };
  }

  sortData(event: any) {
    console.log(event);
  }

  onFilter(){

    if (this.filterCriteria.length > 0 && this.filterCriteria.length < 3)
      return;

    this.gridData.filter = this.filterCriteria.trim().toLowerCase();
    this.refreshKpis(this.gridData.filteredData);
  }
}
