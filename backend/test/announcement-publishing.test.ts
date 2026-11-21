import {test} from 'node:test';
import * as assert from 'node:assert/strict';
import {ForbiddenException, BadRequestException} from '@nestjs/common';
import {UserRole} from '@prisma/client';
import {NotificationsService} from '../src/modules/notifications/notifications.service';
import {AnnouncementAudience} from '../src/modules/notifications/dto/publish-announcement.dto';
import type {AuthenticatedUser} from '../src/common/types/authenticated-user.type';

const student=(id:string,role:UserRole=UserRole.STUDENT):AuthenticatedUser=>({
  id,email:id+'@example.test',fullName:id,role,
});

function fixture(){
  const batches:unknown[][]=[];
  const db={
    course:{findUnique:async()=>({id:'course-1',createdById:'lecturer-1'})},
    enrollment:{findMany:async()=>[{userId:'student-1'},{userId:'student-2'},{userId:'student-1'}]},
    user:{findMany:async()=>[{id:'student-1'},{id:'student-2'}]},
    notification:{createMany:async({data}:{data:unknown[]})=>{batches.push(data);return {count:data.length};}},
  };
  return {service:new NotificationsService(db as never),batches};
}
const payload={title:'Workshop reminder',body:'We will meet on Friday to review your prototypes.',audience:AnnouncementAudience.COURSE,courseId:'course-1'};
test('student cannot post announcements',async()=>{
  const {service,batches}=fixture();
  await assert.rejects(()=>service.publishAnnouncement(payload,student('student-1')),ForbiddenException);
  assert.equal(batches.length,0);
});
test('lecturer cannot send platform-wide broadcasts',async()=>{
  const {service,batches}=fixture();
  await assert.rejects(()=>service.publishAnnouncement({...payload,audience:AnnouncementAudience.ALL_STUDENTS,courseId:undefined},student('lecturer-1',UserRole.LECTURER)),ForbiddenException);
  assert.equal(batches.length,0);
});
test('lecturer cannot announce for a different instructor course',async()=>{
  const {service,batches}=fixture();
  await assert.rejects(()=>service.publishAnnouncement(payload,student('other-instructor',UserRole.LECTURER)),ForbiddenException);
  assert.equal(batches.length,0);
});
test('course announcements are persisted only for unique enrolled recipients',async()=>{
  const {service,batches}=fixture();
  const result=await service.publishAnnouncement(payload,student('lecturer-1',UserRole.LECTURER));
  assert.equal(result.sent,2);
  assert.equal(batches.length,1);
  const rows=batches[0] as {recipientId:string;type:string;entityType:string;entityId:string;message:string;dedupeKey:string}[];
  assert.deepEqual(rows.map(item=>item.recipientId),['student-1','student-2']);
  assert.ok(rows.every(item=>item.type==='COURSE_ANNOUNCEMENT'&&item.entityId==='course-1'&&item.message.includes('Workshop reminder')));
  assert.notEqual(rows[0].dedupeKey,rows[1].dedupeKey);
});
test('admin broadcasts platform notices and rejects ambiguous targeting',async()=>{
  const {service,batches}=fixture();
  await assert.rejects(()=>service.publishAnnouncement({...payload,audience:AnnouncementAudience.ALL_STUDENTS},student('admin',UserRole.ADMIN)),BadRequestException);
  const result=await service.publishAnnouncement({...payload,audience:AnnouncementAudience.ALL_STUDENTS,courseId:undefined},student('admin',UserRole.ADMIN));
  assert.equal(result.sent,2);
  const rows=batches[0] as {type:string;entityType:string}[];
  assert.ok(rows.every(row=>row.type==='PLATFORM_ANNOUNCEMENT'&&row.entityType==='Platform'));
});
