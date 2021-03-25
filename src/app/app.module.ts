import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatInputModule } from "@angular/material/input";
import { MatIconModule } from "@angular/material/icon";

import { MatTableExporterModule } from "mat-table-exporter";

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { FormsModule } from '@angular/forms';
import { HoldingsComponent } from './holdings/holdings.component';
import { GainsComponent } from './gains/gains.component';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    HoldingsComponent,
    GainsComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    MatTabsModule,
    MatTableModule,
    MatCardModule,
    MatSortModule,
    MatChipsModule,
    MatSelectModule,
    MatInputModule,
    MatIconModule,
    MatTableExporterModule

  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
