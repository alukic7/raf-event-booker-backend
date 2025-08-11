import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ nullable: false, length: 255, unique: true })
  name: string

  @Column({ nullable: false, type: 'text' })
  description: string
}
