import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
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
import { WhatsAppService } from '../../services/whatsapp.service';
import { Case, CaseStatus, CasePriority, CaseType } from '../../models/case.model';

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
  selectedCaseType: number | null = null;

  statusOptions = [
    { label: 'सर्व', value: null },
    { label: 'उघडा', value: CaseStatus.OPEN },
    { label: 'प्रगतीत', value: CaseStatus.IN_PROGRESS },
    { label: 'तपासणी अंतर्गत', value: CaseStatus.UNDER_INVESTIGATION },
    { label: 'न्यायालयासाठी प्रलंबित', value: CaseStatus.PENDING_COURT },
    { label: 'बंद', value: CaseStatus.CLOSED },
    { label: 'संग्रहित', value: CaseStatus.ARCHIVED }
  ];

  priorityOptions = [
    { label: 'सर्व', value: null },
    { label: 'कमी', value: CasePriority.LOW },
    { label: 'मध्यम', value: CasePriority.MEDIUM },
    { label: 'उच्च', value: CasePriority.HIGH },
    { label: 'तातडीचे', value: CasePriority.URGENT }
  ];

  caseTypeOptions = [
    { label: 'सर्व', value: null },
    { label: '45 दिवस', value: CaseType.DAYS_45 },
    { label: '60 दिवस', value: CaseType.DAYS_60 },
    { label: '90 दिवस', value: CaseType.DAYS_90 }
  ];

  constructor(
    private caseService: CaseService,
    private whatsappService: WhatsAppService,
    private router: Router,
    private route: ActivatedRoute,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['filter'] === 'pending') {
        this.selectedStatus = null;
        this.applyFilters();
      } else if (params['filter'] === 'closed') {
        this.selectedStatus = CaseStatus.CLOSED;
        this.applyFilters();
      } else if (params['filter'] === 'alert') {
        this.applyFilters();
      }
    });
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
    } else if (this.route.snapshot.queryParams['filter'] === 'pending') {
      filtered = filtered.filter(c => c.status !== CaseStatus.CLOSED && c.status !== CaseStatus.ARCHIVED);
    }

    // Priority filter
    if (this.selectedPriority) {
      filtered = filtered.filter(c => c.priority === this.selectedPriority);
    }

    // Case type filter
    if (this.selectedCaseType !== null) {
      filtered = filtered.filter(c => c.caseType === this.selectedCaseType);
    }

    // Alert filter (closer to date)
    if (this.route.snapshot.queryParams['filter'] === 'alert') {
      filtered = filtered.filter(c => {
        if (c.status === CaseStatus.CLOSED || c.status === CaseStatus.ARCHIVED) {
          return false;
        }
        const daysRemaining = this.caseService.getDaysRemaining(c);
        return daysRemaining >= 0 && daysRemaining <= 5;
      });
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

  onCaseTypeChange() {
    this.applyFilters();
  }

  getDaysRemaining(caseItem: Case): number {
    return this.caseService.getDaysRemaining(caseItem);
  }

  getDaysRemainingColor(caseItem: Case): string {
    const daysRemaining = this.getDaysRemaining(caseItem);
    
    if (caseItem.status === CaseStatus.CLOSED || caseItem.status === CaseStatus.ARCHIVED) {
      return 'gray';
    }

    if (daysRemaining < 0) {
      return 'red';
    } else if (daysRemaining <= 5) {
      return 'red';
    } else if (daysRemaining <= 10) {
      return 'orange';
    } else if (daysRemaining <= 20) {
      return 'yellow';
    } else {
      return 'green';
    }
  }

  async sendWhatsApp(caseItem: Case) {
    if (!caseItem.investigationOfficePhone) {
      this.messageService.add({
        severity: 'warn',
        summary: 'सूचना',
        detail: 'या केससाठी फोन नंबर उपलब्ध नाही'
      });
      return;
    }

    const isConfigured = await this.whatsappService.isConfigured();
    if (!isConfigured) {
      this.messageService.add({
        severity: 'warn',
        summary: 'सूचना',
        detail: 'कृपया सेटिंग्जमध्ये WhatsApp कॉन्फिगर करा'
      });
      return;
    }

    const daysRemaining = this.getDaysRemaining(caseItem);
    const success = await this.whatsappService.sendCaseReminder(
      caseItem.investigationOfficePhone,
      caseItem.caseNumber,
      caseItem.caseDate,
      daysRemaining,
      caseItem.caseType
    );

    if (success) {
      this.messageService.add({
        severity: 'success',
        summary: 'यश',
        detail: 'WhatsApp संदेश यशस्वीरित्या पाठवला'
      });
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'त्रुटी',
        detail: 'WhatsApp संदेश पाठवताना त्रुटी आली'
      });
    }
  }

  viewCase(caseItem: Case) {
    this.router.navigate(['/cases', caseItem.id]);
  }

  editCase(caseItem: Case) {
    this.router.navigate(['/cases/edit', caseItem.id]);
  }

  deleteCase(caseItem: Case) {
    this.confirmationService.confirm({
      message: `तुम्हाला खात्री आहे की तुम्ही केस ${caseItem.caseNumber} हटवू इच्छिता?`,
      header: 'हटवण्याची पुष्टी',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          await this.caseService.deleteCase(caseItem.id!);
          this.messageService.add({
            severity: 'success',
            summary: 'यश',
            detail: 'केस यशस्वीरित्या हटवला'
          });
        } catch (error) {
          this.messageService.add({
            severity: 'error',
            summary: 'त्रुटी',
            detail: 'केस हटवण्यात अयशस्वी'
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
