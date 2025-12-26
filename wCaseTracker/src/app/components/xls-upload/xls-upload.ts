import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { FileUploadModule } from 'primeng/fileupload';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CaseService } from '../../services/case.service';
import { ReminderService } from '../../services/reminder.service';
import { parseXLSFile } from '../../utils/xls-parser';
import { Case, CaseStatus, CasePriority } from '../../models/case.model';

@Component({
  selector: 'app-xls-upload',
  imports: [
    CommonModule,
    CardModule,
    FileUploadModule,
    ButtonModule,
    ProgressBarModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './xls-upload.html',
  styleUrl: './xls-upload.scss'
})
export class XlsUpload {
  uploading: boolean = false;
  progress: number = 0;
  uploadedCount: number = 0;
  totalCount: number = 0;

  constructor(
    private caseService: CaseService,
    private reminderService: ReminderService,
    private messageService: MessageService,
    private router: Router
  ) {}

  async onFileSelect(event: any) {
    const files = event.files || event.target?.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      this.messageService.add({
        severity: 'error',
        summary: 'त्रुटी',
        detail: 'कृपया वैध Excel फाइल (xlsx किंवा xls) अपलोड करा'
      });
      return;
    }

    await this.uploadFile(file);
  }

  async uploadFile(file: File) {
    this.uploading = true;
    this.progress = 0;
    this.uploadedCount = 0;

    try {
      this.progress = 10;
      const parsedCases = await parseXLSFile(file);
      this.totalCount = parsedCases.length;

      if (parsedCases.length === 0) {
        this.messageService.add({
          severity: 'warn',
          summary: 'सूचना',
          detail: 'फाइलमध्ये कोणतेही वैध केसेस सापडले नाहीत'
        });
        return;
      }

      this.progress = 30;

      for (let i = 0; i < parsedCases.length; i++) {
        const parsedCase = parsedCases[i];
        
        const caseData: Omit<Case, 'id' | 'createdAt' | 'updatedAt'> = {
          caseNumber: parsedCase.caseNumber,
          title: parsedCase.title || parsedCase.caseNumber,
          description: parsedCase.description || '',
          status: CaseStatus.OPEN,
          priority: CasePriority.MEDIUM,
          category: '',
          location: parsedCase.location || '',
          complainant: parsedCase.complainant,
          accused: parsedCase.accused,
          filingDate: parsedCase.caseDate,
          caseDate: parsedCase.caseDate,
          caseType: parsedCase.caseType,
          investigationOfficeName: parsedCase.investigationOfficeName,
          investigationOfficePhone: parsedCase.investigationOfficePhone
        };

        await this.caseService.addCase(caseData);
        this.uploadedCount++;
        this.progress = 30 + (i + 1) / parsedCases.length * 60;
      }

      this.progress = 100;

      this.messageService.add({
        severity: 'success',
        summary: 'यश',
        detail: `${this.uploadedCount} केसेस यशस्वीरित्या आयात केले`
      });

      setTimeout(() => {
        this.router.navigate(['/cases']);
      }, 1500);
    } catch (error) {
      console.error('Upload error:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'त्रुटी',
        detail: 'फाइल अपलोड करताना त्रुटी आली: ' + (error instanceof Error ? error.message : 'अज्ञात त्रुटी')
      });
    } finally {
      this.uploading = false;
      this.progress = 0;
    }
  }
}

