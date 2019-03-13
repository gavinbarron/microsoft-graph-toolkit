import * as MicrosoftGraph from "@microsoft/microsoft-graph-types"
import { Client, ResponseType } from "@microsoft/microsoft-graph-client"

import { IAuthProvider } from "./IAuthProvider";

export interface IGraph {
    getMe() : Promise<MicrosoftGraph.User>;
    getUser(id: string) : Promise<MicrosoftGraph.User>;
    findPerson(query: string) : Promise<MicrosoftGraph.Person[]>;
    myPhoto() : Promise<string>;
    getUserPhoto(id: string) : Promise<string>;
    getMyCalendarEvents(startDateTime : Date, endDateTime : Date) : Promise<Array<MicrosoftGraph.Event>>
}

export class Graph implements IGraph {

    // private token: string;
    private client : Client;

    private _provider : IAuthProvider;

    constructor(provider: IAuthProvider) {
        this._provider = provider;
        this.client = Client.init({
            authProvider: async (done) => {
                let token = await this._provider.getAccessToken();
                done(null, token);
            }
        })
    }

    async getMe() : Promise<MicrosoftGraph.User> {
        this._provider.addScope('user.read')
        return await this.client.api('me').get();
    }

    async getUser(userPrincipleName: string) : Promise<MicrosoftGraph.User> {
        this._provider.addScope('user.readbasic.all')
        return await this.client.api(`/users/${userPrincipleName}`).get();
    }

    async findPerson(query: string) : Promise<MicrosoftGraph.Person[]>{
        this._provider.addScope('people.read')
        let result = await this.client.api(`/me/people`).search('"' + query + '"').get();
        return result ? result.value : null;
    }

    async myPhoto() : Promise<string> {
        this._provider.addScope('user.read')
        let blob = await this.client.api('/me/photo/$value').responseType(ResponseType.BLOB).get();
        return await this.blobToBase64(blob);
    }

    async getUserPhoto(id: string) : Promise<string> {
        this._provider.addScope('user.readbasic.all')
        let blob = await this.client.api(`users/${id}/photo/$value`).responseType(ResponseType.BLOB).get();
        return await this.blobToBase64(blob);
    }

    private blobToBase64(blob: Blob) : Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader;
            reader.onerror = reject;
            reader.onload = _ => {
                resolve(reader.result as string);
            }
            reader.readAsDataURL(blob);
        });
    }

    // private async getBase64(resource: string, scopes: string[]) : Promise<string> {
    //     try {
    //         let response = await this.get(resource, scopes);
    //         if (!response) {
    //             return null;
    //         }

    //         let blob = await response.blob();
            
    //         return new Promise((resolve, reject) => {
    //             const reader = new FileReader;
    //             reader.onerror = reject;
    //             reader.onload = _ => {
    //                 resolve(reader.result as string);
    //             }
    //             reader.readAsDataURL(blob);
    //         });
    //     } catch {
    //         return null;
    //     }
    // }

    async getMyCalendarEvents(startDateTime : Date, endDateTime : Date) : Promise<MicrosoftGraph.Event[]> {
        let sdt = `startdatetime=${startDateTime.toISOString()}`;
        let edt = `enddatetime=${endDateTime.toISOString()}`
        let uri = `/me/calendarview?${sdt}&${edt}`;

        let calendarView = await this.client.api(uri).get();
        return calendarView ? calendarView.value : null;
    }
}
