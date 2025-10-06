import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ReminderService } from '../../services/reminder.service';
import { ReminderPriority, ReminderType } from '../../models/reminder.model';

@Component({
  selector: 'app-reminder-form',
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
  templateUrl: './reminder-form.html',
  styleUrl: './reminder-form.scss'
})
export class ReminderForm implements OnInit {
  reminderForm!: FormGroup;
  loading = false;

  priorityOptions = [
    { label: 'Low', value: ReminderPriority.LOW },
    { label: 'Medium', value: ReminderPriority.MEDIUM },
    { label: 'High', value: ReminderPriority.HIGH }
  ];

  typeOptions = [
    { label: 'Court Hearing', value: ReminderType.COURT_HEARING },
    { label: 'Follow Up', value: ReminderType.FOLLOW_UP },
    { label: 'Document Submission', value: ReminderType.DOCUMENT_SUBMISSION },
    { label: 'Investigation', value: ReminderType.INVESTIGATION },
    { label: 'Meeting', value: ReminderType.MEETING },
    { label: 'Other', value: ReminderType.OTHER }
  ];

  constructor(
    private fb: FormBuilder,
    private reminderService: ReminderService,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    this.reminderForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      dueDate: [tomorrow, Validators.required],
      reminderTime: [tomorrow, Validators.required],
      priority: [ReminderPriority.MEDIUM, Validators.required],
      type: [ReminderType.OTHER, Validators.required]
    });
  }

  async onSubmit() {
    if (this.reminderForm.invalid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please fill all required fields'
      });
      return;
    }

    this.loading = true;

    try {
      const formValue = this.reminderForm.value;

      await this.reminderService.addReminder({
        ...formValue,
        isCompleted: false,
        notificationSent: false
      });

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Reminder created successfully'
      });

      setTimeout(() => {
        this.router.navigate(['/reminders']);
      }, 1000);
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to create reminder'
      });
    } finally {
      this.loading = false;
    }
  }

  onCancel() {
    this.router.navigate(['/reminders']);
  }
}
