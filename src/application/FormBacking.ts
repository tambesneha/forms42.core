/*
 * This code is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License version 3 only, as
 * published by the Free Software Foundation.

 * This code is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License
 * version 2 for more details (a copy is included in the LICENSE file that
 * accompanied this code).
 */

import { Form } from '../public/Form.js';
import { Form as ViewForm } from '../view/Form.js';
import { Form as ModelForm } from '../model/Form.js';

import { Key } from '../model/relations/Key.js';
import { Relation } from '../model/relations/Relation.js';

import { Block } from '../public/Block.js';
import { FormMetaData } from './FormMetaData.js';
import { Block as ViewBlock } from '../view/Block.js';
import { Block as ModelBlock } from '../model/Block.js';
import { ListOfValues } from '../public/ListOfValues.js';
import { EventType } from '../control/events/EventType.js';
import { FormEvents } from '../control/events/FormEvents.js';
import { DateConstraint } from '../public/DateConstraint.js';
import { Connection } from '../database/Connection.js';
import { Alert } from './Alert.js';

export class FormBacking
{
	private static form:Form = null;

	private static vforms:Map<Form,ViewForm> =
		new Map<Form,ViewForm>();

	private static mforms:Map<Form,ModelForm> =
		new Map<Form,ModelForm>();

	private static bdata:Map<Form,FormBacking> =
		new Map<Form,FormBacking>();

	public static getCurrentForm() : Form
	{
		return(FormBacking.form);
	}

	public static getCurrentViewForm() : ViewForm
	{
		return(FormBacking.vforms.get(FormBacking.form));
	}

	public static getCurrentModelForm() : ModelForm
	{
		return(FormBacking.mforms.get(FormBacking.form));
	}

	public static setCurrentForm(form:Form|ViewForm|ModelForm) : void
	{
		if (form instanceof ViewForm)
		{
			FormBacking.form = form.parent;
			return;
		}

		if (form instanceof ModelForm)
		{
			FormBacking.form = form.parent;
			return;
		}

		FormBacking.form = form;
	}

	public static getBacking(form:Form) : FormBacking
	{
		return(FormBacking.bdata.get(form));
	}

	public static setBacking(form:Form) : FormBacking
	{
		let back:FormBacking = new FormBacking(form);
		FormBacking.bdata.set(form,back);
		return(back);
	}

	public static removeBacking(form:Form) : void
	{
		FormBacking.cleanup(form);
		FormBacking.bdata.delete(form);
		if (form == FormBacking.form) FormBacking.form = null;
	}

	public static cleanup(form:Form) : void
	{
		FormMetaData.cleanup(form);
		FormBacking.mforms.delete(form);
		FormBacking.vforms.delete(form);
		FormBacking.getBacking(form).clearAutoGenerated();
		FormBacking.getBacking(form).removeAllEventListeners();
	}

	public static getViewForm(form:Form, create?:boolean) : ViewForm
	{
		let vfrm:ViewForm = FormBacking.vforms.get(form);
		if (vfrm == null && create) vfrm = new ViewForm(form);
		return(vfrm);
	}

	public static setViewForm(form:Form, view:ViewForm) : void
	{
		FormBacking.vforms.set(form,view);
	}

	public static getModelForm(form:Form, create?:boolean) : ModelForm
	{
		let mfrm:ModelForm = FormBacking.mforms.get(form);
		if (mfrm == null && create) mfrm = new ModelForm(form);
		return(mfrm);
	}

	public static setModelForm(form:Form, model:ModelForm) : void
	{
		FormBacking.mforms.set(form,model);
	}

	public static getViewBlock(block:Block|ModelBlock, create?:boolean) : ViewBlock
	{
		let form:ViewForm = null;

		if (block instanceof Block) form = FormBacking.getViewForm(block.form,create);
		else 								 form = FormBacking.getViewForm(block.form.parent,create);

		let blk:ViewBlock = form.getBlock(block.name);
		if (blk == null && create) blk = new ViewBlock(form,block.name);

		return(blk);
	}

	public static getModelBlock(block:Block|ViewBlock, create?:boolean) : ModelBlock
	{
		let form:ModelForm = null;

		if (block instanceof Block) form = FormBacking.getModelForm(block.form,create);
		else 								 form = FormBacking.getModelForm(block.form.parent,create);

		let blk:ModelBlock = form.getBlock(block.name);
		if (blk == null && create) blk = new ModelBlock(form,block.name);

		return(blk);
	}

	public static async save() : Promise<boolean>
	{
		let forms:ModelForm[] = [...FormBacking.mforms.values()];

		for (let i = 0; i < forms.length; i++)
		{
			if (!await forms[i].view.validate())
				return(false);
		}

		let dbconns:Connection[] = Connection.getAllConnections();

		for (let i = 0; i < dbconns.length; i++)
		{
			if (dbconns[i].connected())
			{
				if (await dbconns[i].commit())
					console.log("mark clean");
			}
		}

		Alert.message("Transactions successfully saved","Transactions");
		return(true);
	}

	public static async undo() : Promise<boolean>
	{
		let forms:ModelForm[] = [...FormBacking.mforms.values()];

		for (let i = 0; i < forms.length; i++)
		{
			if (!await forms[i].undo())
				return(false);
		}

		let dbconns:Connection[] = Connection.getAllConnections();

		for (let i = 0; i < dbconns.length; i++)
		{
			if (dbconns[i].connected())
			{
				if (await dbconns[i].rollback())
					console.log("mark clean");
			}
		}

		Alert.message("Transactions successfully rolled back","Transactions");
		return(true);
	}


	private parent$:Form = null;
	private links$:Relation[] = [];
	private page$:HTMLElement = null;
	private listeners$:object[] = [];
	private autoblocks$:Block[] = [];
	private haschild$:boolean = false;

	private lovs$:Map<string,Map<string,ListOfValues>> =
		new Map<string,Map<string,ListOfValues>>();

	private datectr$:Map<string,Map<string,DateConstraint>> =
		new Map<string,Map<string,DateConstraint>>();

	constructor(public form:Form) {}

	public get page() : HTMLElement
	{
		return(this.page$);
	}

	public set page(page:HTMLElement)
	{
		this.page$ = page;
	}

	public get parent() : Form
	{
		return(this.parent$);
	}

	public set parent(form:Form)
	{
		this.parent$ = form;
	}

	public get wasCalled() : boolean
	{
		return(this.parent$ != null);
	}

	public get hasModalChild() : boolean
	{
		return(this.haschild$);
	}

	public set hasModalChild(flag:boolean)
	{
		this.haschild$ = flag;
	}

	public get listeners() : object[]
	{
		return(this.listeners$);
	}

	public set listeners(listeners:object[])
	{
		this.listeners$ = listeners;
	}

	public getListOfValues(block:string, field:string) : ListOfValues
	{
		block = block?.toLowerCase();
		field = field?.toLowerCase();
		return(this.lovs$.get(block)?.get(field));
	}

	public setListOfValues(block:string, field:string, lov:ListOfValues) : void
	{
		block = block?.toLowerCase();
		field = field?.toLowerCase();

		let lovs:Map<string,ListOfValues> = this.lovs$.get(block);

		if (lovs == null)
		{
			lovs = new Map<string,ListOfValues>();
			this.lovs$.set(block,lovs);
		}

		lovs.set(field,lov);
	}

	public getDateConstaing(block:string, field:string) : DateConstraint
	{
		block = block?.toLowerCase();
		field = field?.toLowerCase();
		return(this.datectr$.get(block).get(field));
	}

	public setDateConstaing(block:string, field:string, constr:DateConstraint) : void
	{
		block = block?.toLowerCase();
		field = field?.toLowerCase();

		let cstrs:Map<string,DateConstraint> = this.datectr$.get(block);

		if (cstrs == null)
		{
			cstrs = new Map<string,DateConstraint>();
			this.datectr$.set(block,cstrs);
		}

		cstrs.set(field,constr);
	}

	public setAutoGenerated(block:Block) : void
	{
		this.autoblocks$.push(block);
	}

	public get links() : Relation[]
	{
		return(this.links$);
	}

	public setLink(master:Key, detail:Key, orphanQueries:boolean) : void
	{
		this.links$.push({master: master, detail: detail, orphanQueries: orphanQueries});
	}

	public clearAutoGenerated() : void
	{
		this.autoblocks$.forEach((block) =>
		{
			this.lovs$.delete(block.name);
			this.datectr$.delete(block.name);
			block.form.blocks.delete(block.name);
		})
	}

	public hasEventListeners() : boolean
	{
		if (this.listeners.length > 1) return(true);
		if (this.listeners.length == 0) return(true);

		if (FormEvents.getListener(this.listeners[0]).filter?.type == EventType.PostViewInit)
			return(false);

		return(true);
	}

	public removeEventListener(handle:object) : void
	{
		let pos:number = this.listeners.indexOf(handle);
		this.listeners.splice(pos,1);
		FormEvents.removeListener(handle);
	}

	public removeAllEventListeners() : void
	{
		this.listeners.forEach((handle) => {FormEvents.removeListener(handle)});
		this.listeners = [];
	}
}