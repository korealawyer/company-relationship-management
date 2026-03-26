import { Company, Consultation, LitigationCase, PersonalLitigation, Document, DocumentCategory, DocumentStatus } from './types';

export interface ConsultItem { id: string; [key: string]: any; }
export interface SmsLogEntry { id: string; [key: string]: any; }
export interface PendingClient { id: string; [key: string]: any; }
export interface CrmNotification { id: string; [key: string]: any; }
export interface ConsultRecord { id: string; [key: string]: any; }

const dummy: any = new Proxy({}, {
    get: function(target, prop) {
        return function() { return []; };
    }
});

export const documentStore: any = dummy;
export const smsStore: any = dummy;
export const meetingRoomStore: any = dummy;
export const attendanceStore: any = dummy;
export const litigationStore: any = dummy;
export const pendingClientStore: any = dummy;
export const personalStore: any = dummy;
export const store: any = dummy;
export const leadStore: any = dummy;
export const consultStore: any = dummy;
export const smsLogStore: any = dummy;
export const NotificationStore: any = dummy;
export const PendingClientStore: any = dummy;

export * from './types';
export * from './constants';
