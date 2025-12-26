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
import { Case, CaseStatus, CasePriority, CaseType } from '../../models/case.model';

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
    { label: 'उघडा', value: CaseStatus.OPEN },
    { label: 'प्रगतीत', value: CaseStatus.IN_PROGRESS },
    { label: 'तपासणी अंतर्गत', value: CaseStatus.UNDER_INVESTIGATION },
    { label: 'न्यायालयासाठी प्रलंबित', value: CaseStatus.PENDING_COURT },
    { label: 'बंद', value: CaseStatus.CLOSED },
    { label: 'संग्रहित', value: CaseStatus.ARCHIVED }
  ];

  priorityOptions = [
    { label: 'कमी', value: CasePriority.LOW },
    { label: 'मध्यम', value: CasePriority.MEDIUM },
    { label: 'उच्च', value: CasePriority.HIGH },
    { label: 'तातडीचे', value: CasePriority.URGENT }
  ];

  caseTypeOptions = [
    { label: '45 दिवस', value: CaseType.DAYS_45 },
    { label: '60 दिवस', value: CaseType.DAYS_60 },
    { label: '90 दिवस', value: CaseType.DAYS_90 }
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
      caseDate: [new Date(), Validators.required],
      caseType: [CaseType.DAYS_60, Validators.required],
      investigationOfficeName: [''],
      investigationOfficePhone: [''],
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
          caseDate: caseData.caseDate ? new Date(caseData.caseDate) : new Date(caseData.filingDate),
          nextHearingDate: caseData.nextHearingDate ? new Date(caseData.nextHearingDate) : null
        });
      }
    });
  }

  async onSubmit() {
    if (this.caseForm.invalid) {
      this.messageService.add({
        severity: 'error',
        summary: 'त्रुटी',
        detail: 'कृपया सर्व आवश्यक फील्ड भरा'
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
          summary: 'यश',
          detail: 'केस यशस्वीरित्या अपडेट झाला'
        });
      } else {
        await this.caseService.addCase(formValue);
        this.messageService.add({
          severity: 'success',
          summary: 'यश',
          detail: 'केस यशस्वीरित्या तयार झाला'
        });
      }

      setTimeout(() => {
        this.router.navigate(['/cases']);
      }, 1000);
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'त्रुटी',
        detail: 'केस सेव्ह करण्यात अयशस्वी'
      });
    } finally {
      this.loading = false;
    }
  }

  onCancel() {
    this.router.navigate(['/cases']);
  }
}
