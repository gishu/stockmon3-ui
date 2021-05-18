import {
  Component,
  OnInit,
  Input,
  AfterViewInit,
  ViewChild,
} from '@angular/core';

import { StockmonService } from '../stockmon.service';
import { HoldingSummary, Holding } from '../viewModel/holdingSummary';
import { asPercent, asCurrency } from '../utilities';

import { BigNumber } from 'bignumber.js';
import * as _ from 'lodash';
import * as moment from 'moment';

import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';

@Component({
  selector: 'mx-holdings',
  templateUrl: './holdings.component.html',
  styleUrls: ['./holdings.component.css'],
})
export class HoldingsComponent implements OnInit, AfterViewInit {
  private _viewLoaded: boolean = false;
  private _accountId: number = -1;

  gridData: MatTableDataSource<any>;
  gridColumns: string[];

  columns : any = {
    None:  [
      'date',
      'category',
      'stock',
      'quantity',
      'costPrice',
      'cmp',
      'tco',
      'unrealizedGain',
      'type',
      'gainPercent',
      'cagr',
      'age',
      'notes',
    ],
    Stock:[
      'category',
      'stock',
      'quantity',
      'costPrice',
      'cmp',
      'tco',
      'unrealizedGain',
      'gainPercent',
    ],
  };
  filterCriteria: string = '';
  groups: string[] = ['None', 'Stock'];

  _selectedGroup = this.groups[0];
  gridDataSets: any;


  @ViewChild(MatSort) sort: MatSort;

  holdingKPIs: { totalCost: number; totalGain: number } = {
    totalCost: 1,
    totalGain: 0,
  };


  @Input()
  set accountId(id: number) {
    this._accountId = id;

    if (!this._viewLoaded) {
      return;
    }

    this.refreshGrid();
  }

  constructor(private stockService: StockmonService) {}

  ngAfterViewInit(): void {
    this._viewLoaded = true;

    this.refreshGrid();
  }

  ngOnInit(): void {}

  refreshGrid() {
    this.stockService
      .getHoldings(this._accountId)
      .then((holdings: any) => {
        
        let stocks = this.getStockSymbolsOrderedByName(holdings);
        this.gridDataSets = {};

        this.stockService.getQuotes(stocks).then((quotes: any) => {
          this.gridDataSets['Stock'] = _.map(stocks, (stock) => {
            let info = holdings[stock],
              costPrice = new BigNumber(info['avg-price']),
              marketPrice = new BigNumber(quotes[stock].price),
              category = quotes[stock].type,
              gain = marketPrice.minus(costPrice),
              gainPercent = 0;

            if (info['avg-price'] > 0) {
              gainPercent = asPercent(
                marketPrice.minus(costPrice).div(costPrice)
              );
            }

            return {
              category: category,
              stock: stock,
              quantity: info['total-qty'],
              averagePrice: asCurrency(costPrice),
              cmp: asCurrency(marketPrice),
              tco: asCurrency(costPrice.times(info['total-qty'])),
              unrealizedGain: asCurrency(
                gain.times(new BigNumber(info['total-qty']))
              ),
              gainPercent: gainPercent,
            };
          });

          // summary kpi
          let today = moment();

          this.gridDataSets['None'] = _.chain(stocks)
            .flatMap((stock) => {
              let stockInfo = holdings[stock];

              return _.map(stockInfo['buys'], (h) => {
                let costPrice = new BigNumber(h['price']),
                  marketPrice = new BigNumber(quotes[stock].price),
                  category = quotes[stock].type,
                  qty = new BigNumber(h['qty']),
                  tco = costPrice.times(qty),
                  gain = marketPrice.minus(costPrice).times(qty),
                  gainPercent = 0,
                  cagr = 0,
                  ageInDays = today.diff(moment(h['date']), 'days');

                if (h.price > 0) {
                  gainPercent = asPercent(
                    marketPrice.minus(h.price).div(h.price)
                  );
                }

                if (h.price > 0 && ageInDays > 30) {
                  cagr = asPercent(
                    this._getCagr(quotes[stock].price, h.price, ageInDays / 365)
                  );
                }

                return {
                  date: h['date'],
                  category: category,
                  stock: stock,
                  quantity: h['qty'],
                  averagePrice: asCurrency(costPrice),
                  cmp: asCurrency(marketPrice),
                  tco: asCurrency(tco),
                  unrealizedGain: asCurrency(gain),
                  notes: h['notes'],
                  type:
                    ageInDays > 365
                      ? 'LONG'
                      : ageInDays > 270
                      ? 'ALMOST'
                      : 'SHORT',
                  age: ageInDays,
                  gainPercent: gainPercent,
                  cagr: cagr,
                };
              });
            })
            .value();

          this.onGroupChanged(this._selectedGroup);
        });
      })
      .catch((err) => console.log);
  }

  private getStockSymbolsOrderedByName(holdings: any) {
    return _.chain(holdings).keys().sort().value();
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
 
  refreshKpis(rows: any[]) {
    let summary = { totalCost: new BigNumber(0), totalGain: new BigNumber(0) };

    summary = _.reduce(
      rows,
      function (acc: any, row) {
        acc.totalCost = acc.totalCost.plus(
          new BigNumber(row.averagePrice).times(row.quantity)
        );
        acc.totalGain = acc.totalGain.plus(new BigNumber(row.unrealizedGain));
        return acc;
      },
      summary
    );

    this.holdingKPIs = {
      totalCost: asCurrency(summary.totalCost),
      totalGain: asCurrency(summary.totalGain),
    };
  }

  private _getCagr(curPrice: number, costPrice: number, ageInYears: number) {
    let cagr =
      Math.pow(
        new BigNumber(curPrice).div(costPrice).toNumber(),
        1 / ageInYears
      ) - 1;
    return new BigNumber(cagr.toPrecision(10));
  }

  getColorCode(row: any) {
    if (this._selectedGroup === 'Stock')
      return {
        nafaa: row.gainPercent > 0.5,
        nuksaan: row.gainPercent < -0.25,
      };
    else
      return {
        nafaa: row.cagr > 0.25,
        nuksaan: row.cagr < -0.15 && row.age > 90,
      };
  }

  exportToCsv(matTableExporter : any) {
    matTableExporter.exportTable('csv', { fileName: 'Holdings-' + this._accountId });
  }
}
