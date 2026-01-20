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
import { Case, CaseStatus, CasePriority, CaseType, CaseCallStatus } from '../../models/case.model';

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
  selectedStation: string | null = null;

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
      // Handle station filter from station dashboard
      if (params['station']) {
        this.selectedStation = params['station'];
      } else {
        this.selectedStation = null;
      }

      if (params['filter'] === 'pending') {
        this.selectedStatus = null;
        this.applyFilters();
      } else if (params['filter'] === 'closed') {
        this.selectedStatus = CaseStatus.CLOSED;
        this.applyFilters();
      } else if (params['filter'] === 'alert') {
        this.applyFilters();
      } else if (params['caseType'] && params['severity']) {
        // Handle severity-based filtering from dashboard
        this.selectedCaseType = parseInt(params['caseType']);
        this.applyFilters();
      } else if (params['station']) {
        // Handle station filter
        if (params['caseType']) {
          this.selectedCaseType = parseInt(params['caseType']);
        }
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

    // Station filter (from station dashboard)
    if (this.selectedStation) {
      filtered = filtered.filter(c => c.location === this.selectedStation);
    }

    // Search filter
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.caseNumber.toLowerCase().includes(search) ||
        c.title.toLowerCase().includes(search) ||
        c.description?.toLowerCase().includes(search) ||
        c.complainant?.toLowerCase().includes(search) ||
        c.accused?.toLowerCase().includes(search) ||
        c.location?.toLowerCase().includes(search)
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

    // Severity-based filter (from dashboard)
    const severity = this.route.snapshot.queryParams['severity'];
    const caseTypeParam = this.route.snapshot.queryParams['caseType'];
    if (severity && caseTypeParam) {
      const caseType = parseInt(caseTypeParam);
      filtered = filtered.filter(c => {
        if (c.status === CaseStatus.CLOSED || c.status === CaseStatus.ARCHIVED) {
          return false;
        }
        if (c.caseType !== caseType) {
          return false;
        }

        if (caseType === CaseType.DAYS_60) {
          const caseDate = new Date(c.caseDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          caseDate.setHours(0, 0, 0, 0);
          const daysSinceCase = Math.floor((today.getTime() - caseDate.getTime()) / (1000 * 60 * 60 * 24));
          
          switch (severity) {
            case 'critical':
              return daysSinceCase >= 55 && daysSinceCase <= 60;
            case 'warning':
              return daysSinceCase >= 50 && daysSinceCase < 55;
            case 'caution':
              return daysSinceCase >= 45 && daysSinceCase < 50;
            case 'overdue':
              return daysSinceCase > 60;
            default:
              return true;
          }
        } else if (caseType === CaseType.DAYS_90) {
          const caseDate = new Date(c.caseDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          caseDate.setHours(0, 0, 0, 0);
          const daysSinceCase = Math.floor((today.getTime() - caseDate.getTime()) / (1000 * 60 * 60 * 24));
          const daysRemaining = 90 - daysSinceCase;
          
          switch (severity) {
            case 'critical':
              return daysRemaining >= 85 && daysSinceCase <= 90;
            case 'warning':
              return daysRemaining >= 80 && daysRemaining < 85;
            case 'caution':
              return daysRemaining >= 75 && daysRemaining < 80;
            case 'overdue':
              return daysSinceCase > 90;
            default:
              return true;
          }
        }

        return true;
      });
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

  getCaseDateToInvestigationPeriodDifference(caseItem: Case): number | null {
    if (!caseItem.investigationPeriod) {
      return null;
    }
    const caseDate = new Date(caseItem.caseDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    caseDate.setHours(0, 0, 0, 0);
    const daysPassed = Math.floor((today.getTime() - caseDate.getTime()) / (1000 * 60 * 60 * 24));
    const difference = daysPassed - caseItem.investigationPeriod;
    return difference;
  }

  getDaysRemainingColor(caseItem: Case): string {
    const daysRemaining = this.getDaysRemaining(caseItem);

    // Closed/Archived cases
    if (caseItem.status === CaseStatus.CLOSED || caseItem.status === CaseStatus.ARCHIVED) {
      return 'gray';
    }

    // Period-specific color coding
    if (caseItem.caseType === CaseType.DAYS_60) {
      // 60-day case color coding
      if (daysRemaining >= 55) {
        return 'red';           // Critical (55+ days)
      } else if (daysRemaining >= 50) {
        return 'orange';        // Warning (50-54 days)
      } else if (daysRemaining >= 45) {
        return 'yellow';        // Caution (45-49 days)
      } else if (daysRemaining >= 0) {
        return 'darkred';       // Overdue approaching (<45 days)
      } else {
        return 'darkred';       // Overdue (past deadline)
      }
    } else if (caseItem.caseType === CaseType.DAYS_90) {
      // 90-day case color coding
      if (daysRemaining >= 85) {
        return 'red';           // Critical (85+ days)
      } else if (daysRemaining >= 80) {
        return 'orange';        // Warning (80-84 days)
      } else if (daysRemaining >= 75) {
        return 'yellow';        // Caution (75-79 days)
      } else if (daysRemaining >= 0) {
        return 'darkred';       // Overdue approaching (<75 days)
      } else {
        return 'darkred';       // Overdue (past deadline)
      }
    } else {
      // 45-day cases: keep current universal logic
      if (daysRemaining < 0) {
        return 'darkred';       // Overdue
      } else if (daysRemaining <= 5) {
        return 'red';           // Critical
      } else if (daysRemaining <= 10) {
        return 'orange';        // Warning
      } else if (daysRemaining <= 20) {
        return 'yellow';        // Caution
      } else {
        return 'green';         // Safe
      }
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

    const daysRemaining = this.getDaysRemaining(caseItem);
    const success = await this.whatsappService.sendCaseReminder(
      caseItem.investigationOfficePhone,
      caseItem.caseNumber,
      caseItem.caseDate,
      daysRemaining,
      caseItem.caseType,
      caseItem.investigationOfficeName,
      caseItem.id
    );

    if (success) {
      this.messageService.add({
        severity: 'success',
        summary: 'यश',
        detail: 'WhatsApp Web उघडला आहे. कृपया संदेश पाठवा.'
      });
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'त्रुटी',
        detail: 'WhatsApp Web उघडताना त्रुटी आली'
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

  getCallStatusSeverity(status: string | undefined): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    if (!status) return 'secondary';
    switch (status) {
      case CaseCallStatus.CALL_DONE: return 'success';
      case CaseCallStatus.CALLED_NO_RESPONSE: return 'warn';
      case CaseCallStatus.INVALID_NUMBER: return 'danger';
      case CaseCallStatus.FOLLOW_UP_REQUIRED: return 'warn';
      case CaseCallStatus.BUSY: return 'info';
      default: return 'secondary';
    }
  }
}
