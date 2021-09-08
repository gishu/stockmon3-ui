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
import BigNumber from 'bignumber.js';
import * as _ from 'lodash';
import { asCurrency, asPercent } from '../utilities';

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

  gridData: MatTableDataSource<any>;
  gridColumns: string[];

  columns : any = {
    None: [
      'sale_date',
      'stock',
      'quantity',
      'costPrice',
      'salePrice',
      'TCO',
      'gain',
      'type',
      'gain_percent',
      'cagr',
      'durationDays',
    ],
    Stock: ['stock', 'TCO', 'gain', 'gain_percent'],
  };
  filterCriteria: string = '';
  groups: string[] = ['None', 'Stock'];

  _selectedGroup = this.groups[0];
  gridDataSets: any;

  @Input()
  set accountId(id: number) {
    this._accountId = id;
  }

  @Input()
  set year(year: number) {
    this._year = year;
    if (this._year > 1981)
      this.refreshGrid();
  }

  @ViewChild(MatSort) sort: MatSort;

  constructor(private stockService: StockmonService) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    
  }

  refreshGrid() {
    this.stockService.getGains(this._accountId, this._year).then((rows) => {
      let gains: any = rows;
      gains.forEach((gain: any) => {
        gain.type = gain.type === 'LT' ? 'LONG' : 'SHORT';
        gain.tco = asCurrency(new BigNumber(gain.qty).times(gain.cost_price));
      });

      let gainsGroupedByStock = _.chain(gains)
        .groupBy('stock')
        .map((rows, stock) => {
          let gains: any = rows;
          _.each(gains, (gain) => {});

          let totalTCO = new BigNumber(0),
            totalGains = new BigNumber(0);
          _.each(gains, (gain) => {
            totalTCO = totalTCO.plus(gain.tco);
            totalGains = totalGains.plus(gain.gain);
          });
          return {
            stock: stock,
            tco: asCurrency(totalTCO),
            gain: asCurrency(totalGains),
            gain_percent: asPercent( totalGains.dividedBy(totalTCO))
          };
        })
        .value();

      this.gridDataSets = { None: gains, Stock: gainsGroupedByStock };
      this.onGroupChanged(this._selectedGroup);
    }).catch(err => {
      console.log(err);
    });
  }
 
  onGroupChanged(selectedGrouping: string) {

    this._selectedGroup = selectedGrouping;
    this.gridColumns = this.columns[selectedGrouping];
    
    this.gridData = new MatTableDataSource(this.gridDataSets[selectedGrouping]);
    this.gridData.sort = this.sort;
    
    this.onFilterChanged(this.filterCriteria);
  }

  onFilterChanged(filterCriteria: any) {
    this.filterCriteria = filterCriteria;
    this.gridData.filter = filterCriteria.trim().toLowerCase();
    this.refreshKpis(this.gridData.filteredData);
  }

  refreshKpis(gains: Gain[]) {
    this.summaryKPIs.totalTCO = gains.reduce(
      (total, item: any) => total + item.tco,
      0
    );
    this.summaryKPIs.totalGain = gains.reduce(
      (total, item: any) => total + item.gain,
      0
    );
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

 

  exportToCsv(matTableExporter: any) {
    matTableExporter.exportTable('csv', {
      fileName: 'Gains' + this._accountId + '-' + this._year,
    });
  }

  
  
}
