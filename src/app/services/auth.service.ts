import { Injectable } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  UserCredential
} from '@angular/fire/auth';
import {doc, docData, Firestore, setDoc} from '@angular/fire/firestore';
import {take, takeUntil} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUserData = null;

  constructor( private auth: Auth,
               private firestore: Firestore) {
    onAuthStateChanged(this.auth, user => {
      console.log('USER changed: ', user);
      if (user) {
        const userDoc = doc(this.firestore, `users/${user.uid}`);
        docData(userDoc, { idField: 'id' }).pipe(
          take(1)
        ).subscribe(data => {
          this.currentUserData = data;
        });
      } else {
        this.currentUserData = null;
      }
    });
  }


  async signup({email, password}): Promise<UserCredential> {
    try {
      const credentials = await createUserWithEmailAndPassword(this.auth, email, password);
      const userDoc = doc(this.firestore, `user/${credentials.user.uid}`);
      await setDoc(userDoc, {email, chats: []});
      return credentials;
    }catch (err){
      throw(err);
    }

}
  login({email, password}) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }
}