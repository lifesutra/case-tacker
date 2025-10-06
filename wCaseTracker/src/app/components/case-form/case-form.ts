import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CaseService } from '../../services/case.service';
import { Case, CaseStatus, CasePriority } from '../../models/case.model';

@Component({
  selector: 'app-case-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    CardModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    DatePickerModule,
    ButtonModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './case-form.html',
  styleUrl: './case-form.scss'
})
export class CaseForm implements OnInit {
  caseForm!: FormGroup;
  isEditMode = false;
  caseId?: number;
  loading = false;

  statusOptions = [
    { label: 'Open', value: CaseStatus.OPEN },
    { label: 'In Progress', value: CaseStatus.IN_PROGRESS },
    { label: 'Under Investigation', value: CaseStatus.UNDER_INVESTIGATION },
    { label: 'Pending Court', value: CaseStatus.PENDING_COURT },
    { label: 'Closed', value: CaseStatus.CLOSED },
    { label: 'Archived', value: CaseStatus.ARCHIVED }
  ];

  priorityOptions = [
    { label: 'Low', value: CasePriority.LOW },
    { label: 'Medium', value: CasePriority.MEDIUM },
    { label: 'High', value: CasePriority.HIGH },
    { label: 'Urgent', value: CasePriority.URGENT }
  ];

  constructor(
    private fb: FormBuilder,
    private caseService: CaseService,
    private router: Router,
    private route: ActivatedRoute,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.initForm();

    // Check if editing existing case
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.caseId = +params['id'];
        this.isEditMode = true;
        this.loadCase(this.caseId);
      }
    });
  }

  initForm() {
    this.caseForm = this.fb.group({
      caseNumber: ['', Validators.required],
      title: ['', Validators.required],
      description: ['', Validators.required],
      status: [CaseStatus.OPEN, Validators.required],
      priority: [CasePriority.MEDIUM, Validators.required],
      category: ['', Validators.required],
      location: ['', Validators.required],
      complainant: [''],
      accused: [''],
      filingDate: [new Date(), Validators.required],
      nextHearingDate: [null],
      notes: ['']
    });
  }

  async loadCase(id: number) {
    this.caseService.getCaseById(id).subscribe(caseData => {
      if (caseData) {
        this.caseForm.patchValue({
          ...caseData,
          filingDate: new Date(caseData.filingDate),
          nextHearingDate: caseData.nextHearingDate ? new Date(caseData.nextHearingDate) : null
        });
      }
    });
  }

  async onSubmit() {
    if (this.caseForm.invalid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please fill all required fields'
      });
      return;
    }

    this.loading = true;

    try {
      const formValue = this.caseForm.value;

      if (this.isEditMode && this.caseId) {
        await this.caseService.updateCase(this.caseId, formValue);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Case updated successfully'
        });
      } else {
        await this.caseService.addCase(formValue);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Case created successfully'
        });
      }

      setTimeout(() => {
        this.router.navigate(['/cases']);
      }, 1000);
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to save case'
      });
    } finally {
      this.loading = false;
    }
  }

  onCancel() {
    this.router.navigate(['/cases']);
  }
}
