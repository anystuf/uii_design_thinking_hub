import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PostVisibility, UserRole } from '@prisma/client';
import { CommunityService } from '../src/modules/community/community.service';
import type { AuthenticatedUser } from '../src/common/types/authenticated-user.type';

const user=(id:string,role:UserRole=UserRole.STUDENT):AuthenticatedUser=>({
  id,email:id+'@example.invalid',fullName:id,role,
});

function setup() {
  const rows:Record<string,unknown>[]=[];
  const accepted:(string|null)[]=[];
  let recent=0;
  let found={id:'q-1',projectId:null,title:'How do we interview?',authorId:'owner',
    visibility:PostVisibility.COMMUNITY,acceptedCommentId:null as string|null};
  const prisma={
    post:{
      findMany:async()=>[],
      count:async()=>recent,
      create:async({data}:{data:Record<string,unknown>})=>{rows.push(data);return {id:'q-1',...data};},
      findUnique:async()=>found,
      update:async({data}:{data:{acceptedCommentId:string|null}})=>{accepted.push(data.acceptedCommentId);found={...found,acceptedCommentId:data.acceptedCommentId};return found;},
      delete:async()=>({id:'q-1'}),
    },
    comment:{
      count:async()=>0,
      findMany:async()=>[],
      findUnique:async()=>({id:'answer-1',postId:'q-1',parentId:null,deletedAt:null}),
      create:async({data}:{data:Record<string,unknown>})=>({id:'answer-1',...data}),
    },
    user:{upsert:async()=>({id:'owner'})},
  };
  return {service:new CommunityService(prisma as never),rows,accepted,
    setRecent:(value:number)=>{recent=value;},
    setProjectPost:()=>{found={...found,projectId:'project-1',title:null};}};
}

test('a community question can be posted without owning any project',async()=>{
  const {service,rows}=setup();
  const response=await service.createQuestion({title:'  How to interview users?  ',body:'  We need to avoid leading questions in interviews.  ',topic:'EMPATHIZE'},user('owner'));
  assert.equal(response.title,'How to interview users?');
  assert.equal(rows.length,1);
  assert.equal(rows[0].projectId,undefined);
  assert.equal(rows[0].topic,'EMPATHIZE');
});

test('community rate limit blocks repeated new questions',async()=>{
  const {service,setRecent,rows}=setup();
  setRecent(3);
  await assert.rejects(()=>service.createQuestion({title:'How to interview users?',body:'We need to avoid leading questions in interviews.',topic:'EMPATHIZE'},user('owner')),
    (error:unknown)=>typeof error==='object' && error!==null && 'status' in error && error.status===429);
  assert.equal(rows.length,0);
});

test('only the question owner or admin may accept a root answer',async()=>{
  const {service,accepted}=setup();
  await assert.rejects(()=>service.acceptQuestionAnswer('q-1','answer-1',user('stranger')),ForbiddenException);
  assert.deepEqual(accepted,[]);
  assert.deepEqual(await service.acceptQuestionAnswer('q-1','answer-1',user('owner')),{acceptedCommentId:'answer-1'});
  assert.deepEqual(await service.acceptQuestionAnswer('q-1','answer-1',user('owner')),{acceptedCommentId:null});
});

test('a project showcase cannot be modified as a standalone question',async()=>{
  const {service,setProjectPost}=setup();
  setProjectPost();
  await assert.rejects(()=>service.acceptQuestionAnswer('q-1','answer-1',user('owner')),NotFoundException);
  await assert.rejects(()=>service.createQuestionAnswer('q-1',{content:'Here is a useful answer.'},user('owner')),NotFoundException);
});
