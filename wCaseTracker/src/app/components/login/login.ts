import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    MessageModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login implements OnInit {
  username: string = '';
  password: string = '';
  errorMessage: string = '';
  loading: boolean = false;
  returnUrl: string = '/dashboard';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/station-dashboard']);
      return;
    }

    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/station-dashboard';
  }

  async onSubmit() {
    if (!this.username || !this.password) {
      this.errorMessage = 'कृपया वापरकर्तानाव आणि संकेतशब्द प्रविष्ट करा';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    try {
      const success = await this.authService.login(this.username, this.password);
      if (success) {
        this.router.navigate([this.returnUrl]);
      } else {
        this.errorMessage = 'अवैध वापरकर्तानाव किंवा संकेतशब्द';
      }
    } catch (error) {
      this.errorMessage = 'लॉगिन करताना त्रुटी आली';
    } finally {
      this.loading = false;
    }
  }
}

