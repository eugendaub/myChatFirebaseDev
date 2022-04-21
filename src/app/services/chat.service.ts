import { Injectable } from '@angular/core';
import {
  addDoc,
  arrayUnion,
  collection,
  collectionData,
  doc,
  docData, documentId,
  Firestore, orderBy, query, serverTimestamp,
  updateDoc, where
} from '@angular/fire/firestore';
import {AuthService} from './auth.service';
import {map, switchMap, take} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {DocumentData} from '@angular/fire/compat/firestore';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  constructor(private firestore: Firestore,
              private auth: AuthService) { }

  getAllUsers(){
    const userId = this.auth.getUserId();

    const userRef = collection(this.firestore, 'users');
    return collectionData(userRef,{idField: 'id'}).pipe(
      take(1),
      map( users => users.filter(user => user.id !== userId))
    );
  }
  startChat(user){
    const userID = this.auth.getUserId();
    const userEmail = this.auth.getUserEmail();
    const chatUsers = [
      {id: userID, email: userEmail},
      {id: user.id, email: user.email}
    ];
    return this.addChat(chatUsers, user.email);

  }

  startGroup(name, users: []){
    const userID = this.auth.getUserId();
    const userEmail = this.auth.getUserEmail();
    const cleanedUsers = users.map((usr: any) =>({
        id: usr.id,
        email: usr.email
      }));
    const chatUsers = [
      {id: userID, email: userEmail},
      ...cleanedUsers
    ];

    const chatsRef = collection(this.firestore, 'chats');

    return this.addChat(chatUsers, name);
  }

  private addChat(chatUsers,name){
    const chatsRef = collection(this.firestore, 'chats');
    const chat = {
      users: chatUsers,
      name
    };

    return addDoc(chatsRef, chat).then( res => {
      console.log('created chat: ', res);
      const groupID = res.id;
      const promises = [];

      // In der DB muss für jeden user der DB eintrag angepasst werden
      // (in diesem Fall in welchen Chats befindet sich der User)
      for(const user of chatUsers){
        const userChatsRef = doc(this.firestore, `users/${user.id}`);
        const update = updateDoc(userChatsRef, {
          chats: arrayUnion(groupID)
        });
        promises.push(update);
      }
      return Promise.all(promises);
    });
  }



  getUserChats() {
    const userId = this.auth.getUserId();
    const userRef = doc(this.firestore, `users/${userId}`);
    return docData(userRef).pipe(
      switchMap(data => {
        console.log('getUserChta Data: ', data);
        const userChats = data.chats;
        const chatsRef = collection(this.firestore, 'chats');
        const q = query(chatsRef, where(documentId(), 'in', userChats));
        return collectionData(q, { idField: 'id' });
      }),
      take(1)
    );
  }

  getChatInfo(chatId){
    const chat = doc(this.firestore, `chats/${chatId}`);
    return docData(chat);
  }

  getChatMessages(chatId){
    const messages = collection(this.firestore, `chats/${chatId}/messages`);
    const q = query(messages, orderBy('createdAt'));
    return collectionData(q, {idField: 'id'});
  }

  addMessage(chatId,msg){
    const userId = this.auth.getUserId();
    const messages = collection(this.firestore, `chats/${chatId}/messages`);
    return addDoc( messages, {
      from: userId,
      msg,
      createdAt: serverTimestamp()
    });
  }
}
