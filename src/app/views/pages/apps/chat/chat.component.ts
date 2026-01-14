import { AfterViewInit, Component } from '@angular/core';
import { NgbDropdownModule, NgbNavModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { NgScrollbarModule } from 'ngx-scrollbar';

@Component({
    selector: 'app-chat',
    imports: [
        NgbNavModule,
        NgbDropdownModule,
        NgScrollbarModule,
        NgbTooltip
    ],
    templateUrl: './chat.component.html',
    styleUrl: './chat.component.scss'
})
export class ChatComponent implements AfterViewInit {

  defaultNavActiveId = 1;

  ngAfterViewInit(): void {

    // Show chat-content when clicking on chat-item for tablet and mobile devices
    document.querySelectorAll('.chat-list .chat-item').forEach(item => {
      item.addEventListener('click', event => {
        document.querySelector('.chat-content')!.classList.toggle('show');
      })
    });

  }

  // back to chat-list for tablet and mobile devices
  backToChatList() {
    document.querySelector('.chat-content')!.classList.toggle('show');
  }

  save() {
    console.log('passs');
  }

}
