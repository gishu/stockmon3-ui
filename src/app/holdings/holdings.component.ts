import { Component, OnInit, Input, AfterViewInit, ViewChild } from '@angular/core';

import { StockmonService } from '../stockmon.service';
import { HoldingSummary } from '../viewModel/holdingSummary';
import { asPercent } from '../utilities'

import { BigNumber } from 'bignumber.js';
import * as _ from 'lodash';
import * as moment from 'moment';

import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';

import { asCurrency } from "../utilities";

@Component({
  selector: 'mx-holdings',
  templateUrl: './holdings.component.html',
  styleUrls: ['./holdings.component.css'],
})
export class HoldingsComponent implements OnInit, AfterViewInit {
  private _viewLoaded: boolean = false;
  private _accountId: number = -1;
  private _year: number = -1;

  holdingsSummary: any;
  holdingsSummaryColumns: string[] = [
    'stock',
    'quantity',
    'costPrice',
    'cmp',
    'tco',
    'unrealizedGain',
    'gainPercent'
  ];
  holdingsColumns: string[] = [
    'date',
    'stock',
    'quantity',
    'costPrice',
    'cmp',
    'unrealizedGain',
    'notes',
    'gainPercent',
    'cagr',
    'age'
  ];

  holdingGroupings : string[] = ["None", "Stock"];
  selectedGrouping = this.holdingGroupings[0];

  gridColumns :string[] = [];
  gridData : any;
  @ViewChild(MatSort) sort: MatSort;


  holdingKPIs: { totalCost: number; totalGain: number } = {totalCost: 1, totalGain:0};
  holdingsGroupedByStock: { stock: string; quantity: any; averagePrice: number; cmp: number; unrealizedGain: number; }[] = [];
  holdings: { date: any; stock: string; quantity: any; averagePrice: number; cmp: number; unrealizedGain: number; notes: any; }[] = [];

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

  ngAfterViewInit(): void {
    this._viewLoaded = true;

    this.refreshGrid();
  }

  ngOnInit(): void {}

  refreshGrid() {
    this.stockService
      .getHoldings(this._accountId)
      .then((holdings: any) => {
        let stocks = _.chain(holdings).keys().sort().value();

        this.stockService.getQuotes(stocks).then((quotes: any) => {
          this.holdingsGroupedByStock = _.map(stocks, (stock) => {
            let info = holdings[stock],
              costPrice = new BigNumber(info['avg-price']),
              marketPrice = new BigNumber(quotes[stock]),
              gain = marketPrice.minus(costPrice),
              gainPercent = 0;

            if (info['avg-price'] > 0){
              gainPercent = asPercent(marketPrice.minus(costPrice).div(costPrice));
              
            }

            return {
              stock: stock,
              quantity: info['total-qty'],
              averagePrice: asCurrency(costPrice),
              cmp: asCurrency(marketPrice),
              tco: asCurrency( costPrice.times(info['total-qty']).div(1000) ),
              unrealizedGain: asCurrency(
                gain.times(new BigNumber(info['total-qty']).div(1000))
              ),
              gainPercent: gainPercent
            };
          });

          // summary kpi 
          let totalCost = new BigNumber(0),
            totalGain = new BigNumber(0),
            today = moment();

          this.holdings = _.chain(stocks)
            .flatMap((stock) => {
              let stockInfo = holdings[stock];
              
              return _.map(stockInfo['buys'], (h) => {
                
                let costPrice = new BigNumber(h['price']),
                  marketPrice = new BigNumber(quotes[stock]),
                  qty = new BigNumber(h['qty']),
                  gain = marketPrice
                    .minus(costPrice)
                    .times(qty),
                  gainPercent = 0,
                  cagr = 0,
                  ageInDays = today.diff( moment(h['date']), 'days');

                totalCost = totalCost.plus(costPrice.times(qty));
                totalGain = totalGain.plus(gain);


                if (h.price > 0) {
                  gainPercent = asPercent(new BigNumber(quotes[stock]).minus(h.price).div(h.price));
                }
          
                if ((h.price > 0) && (ageInDays > 30)) {
                  cagr = asPercent( this._getCagr(quotes[stock], h.price, ageInDays / 365) );
                }

                return {
                  date: h['date'],
                  stock: stock,
                  quantity: h['qty'],
                  averagePrice: asCurrency(costPrice),
                  cmp: asCurrency(marketPrice),
                  unrealizedGain: asCurrency(gain.div(1000)),
                  notes: h['notes'],
                  age: ageInDays,
                  gainPercent: gainPercent,
                  cagr: cagr
                };
              });
            })
            .value();

          this.holdingKPIs = {
            totalCost: asCurrency(totalCost.div(1000)),
            totalGain: asCurrency(totalGain.div(1000)),
          };

          this.onGroupingChange("None");
          
        });
      })
      .catch((err) => console.log);
  }

  private _getCagr(curPrice : number, costPrice : number, ageInYears : number) {
    let cagr = Math.pow(new BigNumber(curPrice).div(costPrice).toNumber(), (1 / ageInYears)) - 1;
    return new BigNumber(cagr.toPrecision(10));
  }

  onGroupingChange(grouping : string){
    this.selectedGrouping = grouping;

    if (grouping === "Stock"){
      this.gridData = new MatTableDataSource( this.holdingsGroupedByStock );
      this.gridColumns = this.holdingsSummaryColumns;
    } else {
      this.gridData =  new MatTableDataSource(this.holdings);
      this.gridColumns = this.holdingsColumns;
    }
    this.gridData.sort = this.sort;

  }

  getColorCode(row : any) {
    if (this.selectedGrouping === "Stock")
    return {
      nafaa: row.gainPercent > 0.5,
      nuksaan: row.gainPercent < -0.25
    }
    else
    return {
        nafaa: row.cagr > 0.25,
        nuksaan: row.cagr < -0.15 && row.age > 90,
      };
  }
}
