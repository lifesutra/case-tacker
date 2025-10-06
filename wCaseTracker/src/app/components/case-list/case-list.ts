import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CaseService } from '../../services/case.service';
import { Case, CaseStatus, CasePriority } from '../../models/case.model';

@Component({
  selector: 'app-case-list',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    ConfirmDialogModule,
    ToastModule,
    SelectModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './case-list.html',
  styleUrl: './case-list.scss'
})
export class CaseList implements OnInit {
  cases: Case[] = [];
  filteredCases: Case[] = [];
  searchTerm: string = '';
  selectedStatus: string | null = null;
  selectedPriority: string | null = null;

  statusOptions = [
    { label: 'All', value: null },
    { label: 'Open', value: CaseStatus.OPEN },
    { label: 'In Progress', value: CaseStatus.IN_PROGRESS },
    { label: 'Under Investigation', value: CaseStatus.UNDER_INVESTIGATION },
    { label: 'Pending Court', value: CaseStatus.PENDING_COURT },
    { label: 'Closed', value: CaseStatus.CLOSED },
    { label: 'Archived', value: CaseStatus.ARCHIVED }
  ];

  priorityOptions = [
    { label: 'All', value: null },
    { label: 'Low', value: CasePriority.LOW },
    { label: 'Medium', value: CasePriority.MEDIUM },
    { label: 'High', value: CasePriority.HIGH },
    { label: 'Urgent', value: CasePriority.URGENT }
  ];

  constructor(
    private caseService: CaseService,
    private router: Router,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadCases();
  }

  loadCases() {
    this.caseService.getCases().subscribe(cases => {
      this.cases = cases;
      this.applyFilters();
    });
  }

  applyFilters() {
    let filtered = [...this.cases];

    // Search filter
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.caseNumber.toLowerCase().includes(search) ||
        c.title.toLowerCase().includes(search) ||
        c.description?.toLowerCase().includes(search) ||
        c.complainant?.toLowerCase().includes(search) ||
        c.accused?.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (this.selectedStatus) {
      filtered = filtered.filter(c => c.status === this.selectedStatus);
    }

    // Priority filter
    if (this.selectedPriority) {
      filtered = filtered.filter(c => c.priority === this.selectedPriority);
    }

    this.filteredCases = filtered;
  }

  onSearch() {
    this.applyFilters();
  }

  onStatusChange() {
    this.applyFilters();
  }

  onPriorityChange() {
    this.applyFilters();
  }

  viewCase(caseItem: Case) {
    this.router.navigate(['/cases', caseItem.id]);
  }

  editCase(caseItem: Case) {
    this.router.navigate(['/cases/edit', caseItem.id]);
  }

  deleteCase(caseItem: Case) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete case ${caseItem.caseNumber}?`,
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          await this.caseService.deleteCase(caseItem.id!);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Case deleted successfully'
          });
        } catch (error) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete case'
          });
        }
      }
    });
  }

  getCaseSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    switch (status) {
      case 'Open': return 'info';
      case 'In Progress': return 'info';
      case 'Under Investigation': return 'warn';
      case 'Pending Court': return 'warn';
      case 'Closed': return 'success';
      default: return 'secondary';
    }
  }

  getPrioritySeverity(priority: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    switch (priority) {
      case 'Urgent': return 'danger';
      case 'High': return 'warn';
      case 'Medium': return 'info';
      case 'Low': return 'secondary';
      default: return 'secondary';
    }
  }
}
