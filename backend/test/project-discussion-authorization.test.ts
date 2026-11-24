import "reflect-metadata";
import {test} from "node:test";
import * as assert from "node:assert/strict";
import {ForbiddenException, BadRequestException} from "@nestjs/common";
import {UserRole} from "@prisma/client";
import {ProjectsService} from "../src/modules/projects/projects.service";
import type {AuthenticatedUser} from "../src/common/types/authenticated-user.type";

type StubState={member:boolean;lecturerOwner:boolean;insertions:{comment:string;authorId:string}[]};
function setup(){
 const state:StubState={member:false,lecturerOwner:false,insertions:[]};
 const prisma={
   project:{findUnique:async()=>({id:"project-1",ownerId:"owner",courseId:"course-1"})},
   projectMember:{findUnique:async()=>state.member?{id:"member-1"}:null},
   course:{findUnique:async()=>({createdById:state.lecturerOwner?"teacher":"other-teacher"})},
   user:{upsert:async()=>({id:"user"})},
   feedback:{create:async({data}:{data:{projectId:string;authorId:string;comment:string}})=>{
     state.insertions.push({comment:data.comment,authorId:data.authorId});
     return {id:"feedback-1",...data};
   }},
 };
 const service=new ProjectsService(prisma as never, {} as never);
 return {state,service};
}
const makeUser=(id:string,role:UserRole):AuthenticatedUser=>({id,email:id+"@example.invalid",fullName:id,role});

test("project member can exchange messages with their lecturer",async()=>{
 const {state,service}=setup();state.member=true;
 const result=await service.createFeedback("project-1",{comment:"  Nhóm cần hỏi gì thêm?  "},makeUser("student",UserRole.STUDENT));
 assert.equal(result.comment,"Nhóm cần hỏi gì thêm?");
 assert.deepEqual(state.insertions,[{authorId:"student",comment:"Nhóm cần hỏi gì thêm?"}]);
});
test("unrelated student cannot write to a private project",async()=>{
 const {state,service}=setup();state.member=false;
 await assert.rejects(()=>service.createFeedback("project-1",{comment:"Outside"},makeUser("outsider",UserRole.STUDENT)),ForbiddenException);
 assert.equal(state.insertions.length,0);
});
test("only the owning course lecturer can reply to that project",async()=>{
 const {state,service}=setup();state.lecturerOwner=true;
 await service.createFeedback("project-1",{comment:"Try another interview."},makeUser("teacher",UserRole.LECTURER));
 assert.equal(state.insertions.length,1);
 state.lecturerOwner=false;
 await assert.rejects(()=>service.createFeedback("project-1",{comment:"Not my course"},makeUser("teacher",UserRole.LECTURER)),ForbiddenException);
 assert.equal(state.insertions.length,1);
});
test("empty and whitespace-only replies cannot be saved",async()=>{
 const {state,service}=setup();state.member=true;
 await assert.rejects(()=>service.createFeedback("project-1",{comment:"   "},makeUser("student",UserRole.STUDENT)),BadRequestException);
 assert.equal(state.insertions.length,0);
});
