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

import { DataType } from "./DataType.js";
import { BrowserEvent } from "../../BrowserEvent.js";
import { dates } from "../../../model/dates/dates.js";
import { FieldProperties } from "../FieldProperties.js";
import { DataConverter, Tier } from "../DataConverter.js";
import { FieldFeatureFactory } from "../../FieldFeatureFactory.js";
import { FieldEventHandler } from "../interfaces/FieldEventHandler.js";
import { FieldImplementation, FieldState } from "../interfaces/FieldImplementation.js";

export class Select implements FieldImplementation, EventListenerObject
{
	private state:FieldState = null;
	private properties:FieldProperties = null;
	private dataconverter:DataConverter = null;
	private eventhandler:FieldEventHandler = null;

	private value$:string = null;
	private multiple:boolean = false;
	private element:HTMLSelectElement = null;
	private datatype:DataType = DataType.string;
    private event:BrowserEvent = BrowserEvent.get();

	public create(eventhandler:FieldEventHandler, _tag:string) : HTMLSelectElement
	{
		this.element = document.createElement("select");
		this.eventhandler = eventhandler;
		return(this.element);
	}

	public apply(properties:FieldProperties) : void
	{
		properties.apply();
		this.properties = properties;
		this.setAttributes(properties.getAttributes());

		if (properties["init$"])
		{
			properties["init$"] = false;
			this.addEvents(this.element);
		}
	}

	public clear() : void
	{
		this.element.options.selectedIndex = 0;
	}

	public getValue() : any
	{
		if (this.dataconverter != null)
		{
			this.value$ = this.dataconverter.getValue(Tier.Backend);
			if (this.value$ == null) this.element.options.selectedIndex = 0;
			return(this.value$);
		}

		if (DataType[this.datatype].startsWith("date"))
		{
			let value:Date = dates.parse(this.value$);
			if (value == null) this.element.options.selectedIndex = 0;
			return(value);
		}

		if (this.datatype == DataType.integer || this.datatype == DataType.decimal)
			return(+this.value$);

		return(this.value$);
	}

	public setValue(value:any) : boolean
	{
		if (this.dataconverter != null)
		{
			this.dataconverter.setValue(Tier.Backend,value);
			value = this.dataconverter.getValue(Tier.Frontend);
		}

		if (DataType[this.datatype].startsWith("date"))
		{
			if (typeof value === "number")
				value = new Date(+value);

			if (value instanceof Date)
				value = dates.format(value);
		}

		this.value$ = value;
		let found:boolean = false;
		let valstr:string = (value+"").trim();
		this.element.options.selectedIndex = -1;

		let values:string[] = [];
		if (valstr.length > 0) values.push(valstr);

		if (this.multiple && valstr.includes(","))
		{
			values = [];
			let opts:string[] = valstr.split(",");

			opts.forEach((opt) =>
			{
				opt = opt.trim();
				if (opt.length > 0) values.push(opt);
			})
		}

		for (let i = 0; i < this.element.options.length; i++)
		{
			if (values.indexOf(this.element.options.item(i).value) >= 0)
			{
				found = true;
				this.element.options.item(i).selected = true;
			}
		}

		if (!found)
			this.element.options.selectedIndex = 0;

		return(found);
	}

	public getIntermediateValue() : string
	{
		return(this.getValue());
	}

	public setIntermediateValue(value:string) : void
	{
		this.setValue(value);
	}

	public getElement() : HTMLElement
	{
		return(this.element);
	}

	public getDataType() : DataType
	{
		return(this.datatype);
	}

	public getFieldState() : FieldState
	{
		return(this.state);
	}

	public setFieldState(state:FieldState) : void
	{
		this.state = state;
		let enabled:boolean = this.properties.enabled;
		let readonly:boolean = this.properties.readonly;

		switch(state)
		{
			case FieldState.OPEN:
				if (enabled) FieldFeatureFactory.setEnabledState(this.element,this.properties,true);
				if (!readonly) FieldFeatureFactory.setReadOnlyState(this.element,this.properties,false);
				break;

			case FieldState.READONLY:
				if (enabled) FieldFeatureFactory.setEnabledState(this.element,this.properties,true);
				FieldFeatureFactory.setReadOnlyState(this.element,this.properties,true);
				break;

			case FieldState.DISABLED:
				FieldFeatureFactory.setEnabledState(this.element,this.properties,false);
				break;
			}
	}

	public setAttributes(attributes:Map<string,string>) : void
	{
		this.multiple = false;
		this.datatype = DataType.string;

        attributes.forEach((_value,attr) =>
        {
			if (attr == "date")
				this.datatype = DataType.date;

			if (attr == "datetime")
				this.datatype = DataType.datetime;

			if (attr == "integer")
				this.datatype = DataType.integer;

			if (attr == "decimal")
				this.datatype = DataType.decimal;

			if (attr == "multiple")
				this.multiple = true;
		});
	}

	public async handleEvent(event:Event) : Promise<void>
	{
        let bubble:boolean = false;
		this.event.setEvent(event);

		if (this.event.type == "wait")
			await this.event.wait();

		if (this.event.waiting)
			return;

		if (this.event.type == "focus")
			bubble = true;

		if (this.event.type == "blur")
			bubble = true;

		if (this.event.type == "change")
		{
			bubble = true;
			this.value$ = this.getSelected();
		}

		if (this.event.accept || this.event.cancel)
		{
			bubble = true;
			this.value$ = this.getSelected();
		}

		if (this.event.bubbleMouseEvent)
			bubble = true;

		if (this.event.onScrollUp)
			bubble = true;

        if (this.event.onScrollDown)
			bubble = true;

        if (this.event.onCtrlKeyDown)
			bubble = true;

        if (this.event.onFuncKey)
			bubble = true;

		this.event.preventDefault();

		if (this.event.navigation) bubble = true;
		else if (this.event.ignore) return;

		if (bubble)
			await this.eventhandler.handleEvent(this.event);
	}

	private getSelected() : string
	{
		let values:string = "";

		for (let i = 0; i < this.element.options.length; i++)
		{
			let option:HTMLOptionElement = this.element.options.item(i);

			if (option.selected)
			{
				if (values.length > 0)
					values += ", ";

				values += option.value;
			}
		}

		if (values.length == 0)
			values = null;

		return(values);
	}

    private addEvents(element:HTMLElement) : void
    {
        element.addEventListener("blur",this);
        element.addEventListener("focus",this);
        element.addEventListener("change",this);

        element.addEventListener("keyup",this);
        element.addEventListener("keydown",this);
        element.addEventListener("keypress",this);

        element.addEventListener("wheel",this);
        element.addEventListener("mouseup",this);
        element.addEventListener("mouseout",this);
        element.addEventListener("mousedown",this);
        element.addEventListener("mouseover",this);
        element.addEventListener("mousemove",this);

        element.addEventListener("drop",this);
        element.addEventListener("dragover",this);

        element.addEventListener("click",this);
        element.addEventListener("dblclick",this);
        element.addEventListener("contextmenu",this);
    }
}