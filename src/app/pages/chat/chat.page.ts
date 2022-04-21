import {Component, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {AuthService} from '../../services/auth.service';
import {ChatService} from '../../services/chat.service';
import {map, switchMap} from 'rxjs/operators';
import {DocumentData} from '@angular/fire/compat/firestore';
import {IonContent} from '@ionic/angular';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
})
export class ChatPage implements OnInit {
  chatId = null;
  currentUserId = null;
  users = null;
  chatInfo = null;
  msg = '';
  messages = [];

  @ViewChild(IonContent) content: IonContent;

  scrollPercentage = 0;

  constructor(private route: ActivatedRoute,
              private authService: AuthService,
              private chatService: ChatService) { }

  ngOnInit() {
    this.chatId = this.route.snapshot.paramMap.get('chatid');
    this.currentUserId = this.authService.getUserId();

    console.log('My Chat: ', this.chatId);
    this.chatService.getChatInfo(this.chatId).pipe(
      switchMap( info => {
        this.users = {};
        this.chatInfo = info;

        for (const user of info.users){
          this.users[user.id]= user.email;
        }
        console.log('info: ', this.users);
        return this.chatService.getChatMessages(this.chatId);
      }),
      map(messages => messages.map(msg=>{
          msg.fromUser = this.users[msg.from] || 'Deleted';
          return msg;
        }))
    ).subscribe(res => {
      console.log('FIN: ', res);
      for (const m of res){
        //durch diese IF-ANwendung werden die neuen msg einfach unten eingefügt ohen die seite neu zu laden
        if (this.messages.filter(msg => msg.id == m.id).length == 0){
          this.messages.push(m);
        }
      }
      setTimeout(()=>{
        this.content.scrollToBottom(400);
      },400);
    });
  }

  sendMessage(){
    this.chatService.addMessage(this.chatId, this.msg).then(_=>{
      this.msg = '';
      this.content.scrollToBottom(300);
    });
  }
  async contentScrolled(ev){
    const scrollElement = await this.content.getScrollElement();
    const scrollPosition = ev.detail.scrollTop;
    const totalContentHeight = scrollElement.scrollHeight;

    this.scrollPercentage = scrollPosition / (totalContentHeight -ev.target.clientHeight) + 0.001;
  }

  scrollDown(){
    this.content.scrollToBottom(300);
  }

  selectImage(){

  }

}
