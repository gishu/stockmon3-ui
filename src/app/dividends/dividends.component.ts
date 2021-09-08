import { Component, Input, AfterViewInit, ViewChild } from '@angular/core';
import { StockmonService } from '../stockmon.service';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Dividend } from '../viewModel/dividend';
import * as _ from 'lodash';

@Component({
  selector: 'mx-dividends',
  templateUrl: './dividends.component.html',
  styleUrls: ['./dividends.component.css'],
})
export class DividendsComponent implements AfterViewInit {

  private _accountId: number = -1;
  private _year: number = -1;

  private _viewLoaded: boolean = false;

  gridData: any;
  gridColumns: string[];

  private columns : any = {
    None: ['date', 'stock', 'amount', 'notes'],
    Stock: ['stock', 'amount'],
  };
  private gridDataSets : any = {};

  groups = ['None', 'Stock'];

  selectedGroup = this.groups[0];
  filterCriteria: string = '';

  summaryKPIs: any = {};


  @ViewChild(MatSort) sort: MatSort;

  constructor(private stockService: StockmonService) {}

  ngAfterViewInit(): void {
    
  }

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

  onGroupChanged(selectedGrouping: string) {

    this.selectedGroup = selectedGrouping;

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

  refreshGrid() {
    this.stockService
      .getDividends(this._accountId, this._year)
      .then((dividends) => {
        this.gridDataSets['None'] = dividends;

        this.gridDataSets['Stock'] = _.chain(dividends)
          .groupBy('stock')
          .map((divs, stock) => {
            let totalAmount = _.chain(divs)
              .reduce((sum, item) => sum + item.amount, 0)
              .value();

            return { stock: stock, amount: totalAmount };
          })
          .value();

          this.onGroupChanged(this.selectedGroup);
      });
  }

  refreshKpis(divs: Dividend[]) {
    this.summaryKPIs.totalDivs = divs.reduce(
      (total, item: Dividend) => total + item.amount,
      0
    );
  }

  exportToCsv(matTableExporter: any) {
    matTableExporter.exportTable('csv', {
      fileName: 'Divs' + this._accountId + '-' + this._year,
    });
  }
}
