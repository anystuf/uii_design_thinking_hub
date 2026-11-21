import {test} from 'node:test';
import * as assert from 'node:assert/strict';
import {ConflictException,ForbiddenException} from '@nestjs/common';
import {ProjectStatus,SubmissionStatus,UserRole} from '@prisma/client';
import {ProjectsService} from '../src/modules/projects/projects.service';
import type {AuthenticatedUser} from '../src/common/types/authenticated-user.type';

const viewer=(id:string,role:UserRole):AuthenticatedUser=>({
  id,role,email:id+'@example.test',fullName:id,
});
function fixture(approvedCount=1){
  let project={id:'project-1',title:'Library research',ownerId:'student-1',courseId:'course-1',status:ProjectStatus.DRAFT};
  const data:{updates:number;notifications:{recipientId:string;type:string;entityType:string}[]}={updates:0,notifications:[]};
  const db={
    project:{
      findUnique:async()=>project,
      updateMany:async({data:update}:{data:{status:ProjectStatus}})=>{project={...project,status:update.status};data.updates++;return {count:1};},
    },
    course:{findUnique:async()=>({id:'course-1',createdById:'lecturer-1'})},
    projectMember:{findMany:async()=>[{userId:'student-2'},{userId:'student-1'}]},
    submissionSnapshot:{count:async()=>approvedCount},
    notification:{createMany:async({data:rows}:{data:typeof data.notifications})=>{data.notifications.push(...rows);return {count:rows.length};}},
    $transaction:async(cb:(tx:unknown)=>Promise<unknown>)=>cb(db),
  };
  return {service:new ProjectsService(db as never,{} as never),data};
}
test('students cannot approve their own project for public showcase',async()=>{
  const {service,data}=fixture();
  await assert.rejects(()=>service.approveForShowcase('project-1',viewer('student-1',UserRole.STUDENT)),ForbiddenException);
  assert.equal(data.updates,0);
});
test('another lecturer cannot approve a project in a course they do not own',async()=>{
  const {service,data}=fixture();
  await assert.rejects(()=>service.approveForShowcase('project-1',viewer('lecturer-2',UserRole.LECTURER)),ForbiddenException);
  assert.equal(data.updates,0);
});
test('whole-project showcase approval requires at least one approved assessment snapshot',async()=>{
  const {service,data}=fixture(0);
  await assert.rejects(()=>service.approveForShowcase('project-1',viewer('lecturer-1',UserRole.LECTURER)),ConflictException);
  assert.equal(data.updates,0);
});
test('reviewer approval makes the project eligible, not publicly published, and notifies team',async()=>{
  const {service,data}=fixture(1);
  const result=await service.approveForShowcase('project-1',viewer('lecturer-1',UserRole.LECTURER));
  assert.equal(result.status,ProjectStatus.APPROVED);
  assert.equal(data.updates,1);
  assert.deepEqual(data.notifications.map(n=>n.recipientId),['student-1','student-2']);
  assert.ok(data.notifications.every(n=>n.type==='SHOWCASE_APPROVED'&&n.entityType==='Project'));
  assert.notEqual(result.status,ProjectStatus.PUBLISHED);
});
